import { App } from "vue";
import VueProjectTree, { type DroppedExtraData} from "./src/components/ProjectTree.vue";

VueProjectTree.install = (app: App) => {
  app.component(VueProjectTree.name, VueProjectTree);
  return app;
};

export default VueProjectTree;
export {
    DroppedExtraData,
};
