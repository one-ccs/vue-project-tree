<script lang="ts">
import { markRaw } from 'vue';
import ProjectTreeVirtual from './virtual/ProjectTreeVirtual.vue';
import ProjectTreeNormal from './normal/ProjectTreeNormal.vue';

export default {
  name: 'VueProjectTree',
  components: {
    ProjectTreeVirtual,
    ProjectTreeNormal,
  },
  props: {
    virtual: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      projectTree: markRaw(this.virtual ? ProjectTreeVirtual : ProjectTreeNormal),
    };
  },
  mounted() {
    const entries = Object.entries(this.$refs.treeRef as [string, Function]);
    for (const [key, value] of entries) {
      (this as any)[key] = value;
    }
  },
};
</script>

<template>
  <component
    :is="projectTree"
    ref="treeRef"
    :virtual="virtual"
    :data="($attrs.data as [])"
    v-bind="$attrs"
  >
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}"></slot>
    </template>
  </component>
</template>

<style lang="less">
.vue-project-tree {
  --color: #666666;
  --color-current: #4c74f6;
  --color-drop-in: #fff;
  --bg-color: transparent;
  --bg-color-current: #e0efff;
  --bg-color-checked: #e0efff;
  --bg-color-hover: #0000000a;
  --bg-color-drop-in: #409eff;
}
</style>
