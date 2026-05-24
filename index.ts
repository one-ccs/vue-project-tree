import type { App } from 'vue';
import VueProjectTree from './src/components/ProjectTree.vue';
import type {
  VueProjectTreeProps,
  VueProjectTreeNodeProps,
  DroppedExtraData,
  NodeData,
} from './src/utils/interface';

VueProjectTree.install = (app: App) => {
  app.component(VueProjectTree.name!, VueProjectTree);
  return app;
};

export default VueProjectTree;
export type { DroppedExtraData, VueProjectTreeProps, VueProjectTreeNodeProps, NodeData };
