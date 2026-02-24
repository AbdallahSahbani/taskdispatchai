import type { SimulatedWorker } from '@/stores/simulationStore';

interface BlueprintWorkerDotProps {
  worker: SimulatedWorker;
  onClick: () => void;
}

export function BlueprintWorkerDot({ worker, onClick }: BlueprintWorkerDotProps) {
  const statusColor = worker.status === 'idle' ? '#34d399'
    : worker.status === 'moving' ? '#38bdf8'
    : '#f59e0b';

  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      {/* Glow ring */}
      <circle
        cx={worker.mapX}
        cy={worker.mapY}
        r={12}
        fill="none"
        stroke={statusColor}
        strokeWidth={1}
        opacity={0.3}
      >
        {worker.status === 'moving' && (
          <animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite" />
        )}
        {worker.status === 'moving' && (
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Worker circle */}
      <circle
        cx={worker.mapX}
        cy={worker.mapY}
        r={9}
        fill={worker.color}
        stroke={statusColor}
        strokeWidth={2}
        filter="url(#workerGlow)"
      />

      {/* Initials */}
      <text
        x={worker.mapX}
        y={worker.mapY}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="monospace"
        fontSize={7}
        fontWeight="bold"
        fill="white"
      >
        {worker.initials}
      </text>

      {/* Status pip */}
      <circle
        cx={worker.mapX + 7}
        cy={worker.mapY - 7}
        r={3}
        fill={statusColor}
        stroke="hsl(210,60%,6%)"
        strokeWidth={1.5}
      />

      {/* Name label on hover (always show for now) */}
      <text
        x={worker.mapX}
        y={worker.mapY + 16}
        textAnchor="middle"
        dominantBaseline="hanging"
        fontFamily="monospace"
        fontSize={6}
        fill="hsl(195,90%,50%)"
        opacity={0.7}
      >
        {worker.name.split(' ')[0]}
      </text>
    </g>
  );
}
