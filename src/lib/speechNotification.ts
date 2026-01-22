// Speech notification system using browser Speech Synthesis API

interface TaskSpeechOptions {
  priority: 'urgent' | 'high' | 'normal';
  workerName: string;
  taskTitle: string;
  location: string;
  roomNumber?: string;
}

// Play alert sound before speech for urgent tasks
export async function playUrgentAlert(): Promise<void> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Two-tone alert
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.15);
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.3);
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
  
  return new Promise(resolve => setTimeout(resolve, 600));
}

// Play a pleasant notification ping
export async function playNotificationPing(): Promise<void> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Pleasant two-tone chime
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.15); // A5
  
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.4);
  
  return new Promise(resolve => setTimeout(resolve, 500));
}

// Speak task notification using browser Speech Synthesis
export function speakTaskNotification(options: TaskSpeechOptions): Promise<void> {
  const { priority, workerName, taskTitle, location, roomNumber } = options;
  
  return new Promise((resolve, reject) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Build the message
    let message = '';
    
    if (priority === 'urgent') {
      message = `Urgent task alert! `;
    } else if (priority === 'high') {
      message = `Priority task. `;
    }
    
    message += `${workerName}, you have a new task: ${taskTitle}. `;
    message += `Location: ${location}. `;
    
    if (roomNumber) {
      // Spell out room number for clarity
      message += `Room number ${roomNumber.split('').join(' ')}. `;
    }
    
    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(message);
    
    // Configure voice settings based on priority
    if (priority === 'urgent') {
      utterance.rate = 1.1;      // Slightly faster
      utterance.pitch = 1.2;     // Higher pitch for urgency
      utterance.volume = 1.0;    // Full volume
    } else {
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
    }
    
    // Select a clear voice (prefer English voices)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      resolve(); // Resolve anyway to not block
    };
    
    // Speak the notification
    window.speechSynthesis.speak(utterance);
  });
}

// Main notification function for task assignment
export async function notifyWorkerOfTask(
  task: {
    priority: 'urgent' | 'high' | 'normal';
    type: string;
    zoneName: string;
    roomNumber?: string;
  },
  worker: {
    name: string;
  }
): Promise<void> {
  try {
    // For urgent tasks, play alert sound first
    if (task.priority === 'urgent') {
      await playUrgentAlert();
    } else {
      await playNotificationPing();
    }
    
    // Speak the task details
    await speakTaskNotification({
      priority: task.priority,
      workerName: worker.name.split(' ')[0], // First name only
      taskTitle: formatTaskType(task.type),
      location: task.zoneName,
      roomNumber: task.roomNumber
    });
  } catch (error) {
    console.error('Failed to notify worker:', error);
  }
}

// Format task type into readable text
function formatTaskType(type: string): string {
  const typeMap: Record<string, string> = {
    towels: 'towel request',
    cleaning: 'room cleaning',
    maintenance: 'maintenance request',
    trash: 'trash pickup',
    room_service: 'room service delivery',
    'room-service': 'room service delivery',
    housekeeping: 'housekeeping',
    'guest-request': 'guest request'
  };
  
  return typeMap[type] || type.replace(/[-_]/g, ' ');
}

// Initialize voices (call this early to ensure voices are loaded)
export function initSpeechSynthesis(): void {
  if ('speechSynthesis' in window) {
    // Load voices
    window.speechSynthesis.getVoices();
    
    // Some browsers need this event
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }
}
