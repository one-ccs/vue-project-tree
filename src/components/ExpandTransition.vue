<template>
    <transition name="expand-transition" v-on="on" :css="false">
        <slot></slot>
    </transition>
</template>

<script setup lang="ts">
import type { RendererElement } from 'vue';

interface AnimateOptions {
    from: number;      // 开始高度
    to: number;        // 结束高度
    duration?: number; // 动画持续时长，单位为ms
    easing?: Function; // 动画函数
}

const backup = (el: RendererElement) => {
    if (!el._backup) el._backup = {};

    el._backup.height = el.style.height;
    el._backup.overflow = el.style.overflow;
    el._backup.opacity = el.style.opacity;
    el.style.overflow = 'hidden';
};

const recover = (el: RendererElement) => {
    cancelAnimationFrame(el._backup.animate);
    el.style.height = el._backup.height;
    el.style.overflow = el._backup.overflow;
    el.style.opacity = el._backup.opacity;
};

const animate = (el: RendererElement, done: Function, {
    from,
    to,
    duration = 500,
    easing = (progress: number) => 1 - Math.pow(1 - progress, 3),
}: AnimateOptions) => {
    const startTime = performance.now(); //动画开始时间

    el.style.height = `${from}px`;
    requestAnimationFrame(function func(timeStamp: number) {
        const elapsedTime = timeStamp - startTime; // 动画已运行时间
        const progress = Math.min(elapsedTime / duration, 1); // 动画进度
        const height = from + (to - from) * easing(progress); // 计算高度
        const opacity = 1 - progress; // 计算透明度

        if (progress < 1) {
            el.style.height = `${height}px`;
            el.style.opacity = `${from ? opacity : 1 - opacity}`;
            requestAnimationFrame(func);
        } else {
            done();
        }
    });
};

const on = {
    beforeEnter(el: RendererElement) {
        backup(el);
    },
    enter(el: RendererElement, done: Function) {
        animate(el, done, { from: 0, to: el.scrollHeight });
    },
    afterEnter(el: RendererElement) {
        recover(el);
    },
    enterCancelled(el: RendererElement) {
        recover(el);
    },
    beforeLeave(el: RendererElement) {
        backup(el);
    },
    leave(el: RendererElement, done: Function) {
        animate(el, done, { from: el.scrollHeight, to: 0 });
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
