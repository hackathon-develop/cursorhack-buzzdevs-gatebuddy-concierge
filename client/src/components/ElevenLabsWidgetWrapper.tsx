import { useApp } from '../contexts/AppContext';
import { buildDynamicVariables } from '../lib/elevenLabsMapper';
import ElevenLabsWidget from './ElevenLabsWidget';

export default function ElevenLabsWidgetWrapper() {
  const { state } = useApp();
  const dynamicVars = buildDynamicVariables(state.tripDetails);

  return (
    <ElevenLabsWidget
      agentId="agent_8101kgaa723te3kafw1zcq63e2c5"
      dynamicVariables={dynamicVars}
    />
  );
}
