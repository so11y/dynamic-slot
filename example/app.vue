<template>
  <div>
    <h3>default slot</h3>
    <Comp v-dynamic-slot.default="defaultSlot">
      <template v-slot:default>
        <div style="color: red">dynamic-slot</div>
      </template>
    </Comp>
    <br />
    <h3>name slot</h3>
    <hr />
    <CompName v-dynamic-slot.foo="nameSlot">
      <template v-slot:default>
        <div>default</div>
      </template>
      <template v-slot:foo>
        <div style="color: red">dynamic-name-slot</div>
      </template>
    </CompName>
    <br />
    <h3>deep slot</h3>
    <hr />
    <CompNest v-dynamic-slot.foo="deepSlot">
      <template v-slot:foo>
        <div style="color: red">dynamic-name-slot</div>
      </template>
    </CompNest>
    <br />
    <h3>reactive</h3>
    <button @click="value++">update</button>
    <hr />
    <Comp v-dynamic-slot.default="defaultSlot">
      <template v-slot:default>
        <div style="color: red">dynamic-slot-update {{ value }}</div>
      </template>
    </Comp>
  </div>
</template>

<script setup lang="ts">
import Comp from "./components/comp.vue";
import CompName from "./components/compName.vue";
import CompNest from "./components/compNest.vue";
import { VNodeDyn } from "../index";
import { ref } from "vue";
const value = ref(0);
function defaultSlot(vnode: VNodeDyn) {
  return {
    referIndex: 0,
    originInsetParentVnode: vnode,
  };
}
function nameSlot(vnode: VNodeDyn) {
  return {
    referIndex: 1,
    originInsetParentVnode: vnode,
  };
}
function deepSlot(vnode: VNodeDyn) {
  return {
    referIndex: 0,
    originInsetParentVnode: vnode.dynamicChildren[0],
  };
}
</script>
