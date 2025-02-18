<template>
    <transition name="expand-transition" v-on="on" :css="false">
        <slot></slot>
    </transition>
</template>

<script setup lang="ts">
import type { RendererElement } from 'vue';

const backup = (el: RendererElement) => {
    if (!el._backup) el._backup = {};

    el._backup.height = el.style.height;
    el._backup.overflow = el.style.overflow;
};

const recover = (el: RendererElement) => {
    cancelAnimationFrame(el._backup.animate);
    el.style.height = el._backup.height;
    el.style.overflow = el._backup.overflow;
};

const on = {
    beforeEnter(el: RendererElement) {
        backup(el);

        el.style.height = '0';
        el.style.overflow = 'hidden';
    },
    enter(el: RendererElement, done: Function) {
        requestAnimationFrame(function func() {
            let height = parseInt(el.style.height);
            let offset = (el.scrollHeight - height) > 1 ? (el.scrollHeight - height) / 2: el.scrollHeight - height;

            if (height < el.scrollHeight) {
                el.style.height = height + offset + 'px';
                requestAnimationFrame(func);
            }
            else {
                done();
            }
        });
    },
    afterEnter(el: RendererElement) {
        recover(el);
    },
    enterCancelled(el: RendererElement) {
        recover(el);
    },
    beforeLeave(el: RendererElement) {
        backup(el);

        el.style.height = el.scrollHeight + 'px';
        el.style.overflow = 'hidden';
    },
    leave(el: RendererElement, done: Function) {
        requestAnimationFrame(function func() {
            let height = parseInt(el.style.height);
            let offset = height / 2 > 1 ? height / 2 : 1;

            if (height > 0) {
                el.style.height = height - offset + 'px';
                requestAnimationFrame(func);
            }
            else {
                done();
            }
        });
    },
    afterLeave(el: RendererElement) {
        recover(el);
    },
    leaveCancelled(el: RendererElement) {
        recover(el);
    },
};
</script>

<style lang="less">
</style>
