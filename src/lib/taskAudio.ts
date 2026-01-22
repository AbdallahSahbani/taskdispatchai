// Audio notification utility for task alerts
// Uses Web Audio API for notification pings

class TaskAudioManager {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  // Initialize audio context (must be called from user interaction)
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return false;
    }
  }

  // Play a notification ping sound
  async playNotificationPing(type: 'normal' | 'urgent' = 'normal'): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }
    
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create oscillator for the ping
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'urgent') {
      // Urgent: Higher pitch, repeating ping pattern
      oscillator.frequency.setValueAtTime(880, now); // A5
      oscillator.frequency.setValueAtTime(1100, now + 0.1); // C#6
      oscillator.frequency.setValueAtTime(880, now + 0.2); // A5
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.12);
      gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.2);
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.22);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      oscillator.start(now);
      oscillator.stop(now + 0.5);
    } else {
      // Normal: Pleasant two-tone chime
      oscillator.frequency.setValueAtTime(523.25, now); // C5
      oscillator.frequency.setValueAtTime(659.25, now + 0.15); // E5
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.15, now + 0.15);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.17);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      oscillator.start(now);
      oscillator.stop(now + 0.5);
    }
  }

  // Play task assignment notification with voice (requires ElevenLabs)
  async playTaskAnnouncement(text: string): Promise<void> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/task-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        console.warn('TTS not available, falling back to ping');
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Clean up URL after playing
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      
      await audio.play();
    } catch (error) {
      console.warn('Task announcement failed:', error);
    }
  }

  // Combined notification: ping + optional voice
  async notifyNewTask(
    taskType: string,
    zoneName: string,
    priority: 'normal' | 'urgent' = 'normal',
    useVoice: boolean = false
  ): Promise<void> {
    // Always play the ping first
    await this.playNotificationPing(priority);

    // Optionally play voice announcement
    if (useVoice) {
      // Small delay between ping and voice
      setTimeout(async () => {
        const urgentPrefix = priority === 'urgent' ? 'Urgent! ' : '';
        const announcement = `${urgentPrefix}New ${taskType} task at ${zoneName}`;
        await this.playTaskAnnouncement(announcement);
      }, 600);
    }
  }

  // Dispose of audio context
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
export const taskAudio = new TaskAudioManager();

// Hook for React components
import { useEffect, useRef, useCallback } from 'react';

export function useTaskAudio() {
  const initialized = useRef(false);

  const initAudio = useCallback(async () => {
    if (!initialized.current) {
      initialized.current = await taskAudio.initialize();
    }
  }, []);

  const playPing = useCallback(async (type: 'normal' | 'urgent' = 'normal') => {
    await initAudio();
    await taskAudio.playNotificationPing(type);
  }, [initAudio]);

  const notifyTask = useCallback(async (
    taskType: string,
    zoneName: string,
    priority: 'normal' | 'urgent' = 'normal',
    useVoice: boolean = false
  ) => {
    await initAudio();
    await taskAudio.notifyNewTask(taskType, zoneName, priority, useVoice);
  }, [initAudio]);

  return { initAudio, playPing, notifyTask };
}
