<template>
    <transition name="expand-transition" v-on="on">
        <slot></slot>
    </transition>
</template>

<script setup lang="ts">
import type { RendererElement } from 'vue';

const reset = (el: RendererElement) => {
    el.style.maxHeight = "";
    el.style.overflow = el.dataset.oldOverflow;
    el.style.paddingTop = el.dataset.oldPaddingTop;
    el.style.paddingBottom = el.dataset.oldPaddingBottom;
};

const on = {
    beforeEnter(el: RendererElement) {
        if (!el.dataset) el.dataset = {};

        el.dataset.oldPaddingTop = el.style.paddingTop;
        el.dataset.oldPaddingBottom = el.style.paddingBottom;
        if (el.style.height) el.dataset.elExistsHeight = el.style.height;

        el.style.maxHeight = 0;
        el.style.paddingTop = 0;
        el.style.paddingBottom = 0;
    },
    enter(el: RendererElement, done: Function) {
        requestAnimationFrame(() => {
            el.dataset.oldOverflow = el.style.overflow;

            if (el.dataset.elExistsHeight) {
                el.style.maxHeight = el.dataset.elExistsHeight;
            } else if (el.scrollHeight !== 0) {
                el.style.maxHeight = `${el.scrollHeight}px`;
            } else {
                el.style.maxHeight = 0;
            }

            el.style.paddingTop = el.dataset.oldPaddingTop;
            el.style.paddingBottom = el.dataset.oldPaddingBottom;
            el.style.overflow = 'hidden';
        });
    },
    afterEnter(el: RendererElement) {
        el.style.maxHeight = '';
        el.style.overflow = el.dataset.oldOverflow;
    },
    enterCancelled(el: RendererElement) {
        reset(el);
    },
    beforeLeave(el: RendererElement) {
        if (!el.dataset) el.dataset = {};

        el.dataset.oldPaddingTop = el.style.paddingTop;
        el.dataset.oldPaddingBottom = el.style.paddingBottom;
        el.dataset.oldOverflow = el.style.overflow;

        el.style.maxHeight = `${el.scrollHeight}px`;
        el.style.overflow = 'hidden';
    },
    leave(el: RendererElement, done: Function) {
        if (el.scrollHeight !== 0) {
            el.style.maxHeight = 0;
            el.style.paddingTop = 0;
            el.style.paddingBottom = 0;
        }
    },
    afterLeave(el: RendererElement) {
        reset(el);
    },
    leaveCancelled(el: RendererElement) {
        reset(el);
    },
};
</script>

<style lang="less">
.expand-transition-enter-active,
.expand-transition-leave-active {
  transition: .3s max-height ease-in-out,
    .3s padding-top ease-in-out,
    .3s padding-bottom ease-in-out;
}
</style>
