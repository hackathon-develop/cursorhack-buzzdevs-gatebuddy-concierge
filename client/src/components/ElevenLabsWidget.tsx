declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': {
        'agent-id': string;
        variant?: 'expanded' | 'compact';
        dismissible?: boolean;
        'server-location'?: string;
        'dynamic-variables'?: string;
      };
    }
  }
}

interface ElevenLabsWidgetProps {
  agentId: string;
  dynamicVariables?: Record<string, string | number | boolean>;
}

export default function ElevenLabsWidget({
  agentId,
  dynamicVariables,
}: ElevenLabsWidgetProps) {
  return (
    <elevenlabs-convai
      agent-id={agentId}
      dynamic-variables={
        dynamicVariables ? JSON.stringify(dynamicVariables) : undefined
      }
    />
  );
}
