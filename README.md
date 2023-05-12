<div align="center">
  <h2>dynamic-slot</h2>
  <p>This Vue 3 directive enables you to inject and insert content into specific locations of a component, even if the component does not have defined slots. With this directive, you can dynamically insert plugins regardless of whether slots are present or not</p>
</div>

```html
<template>
  <div>
    <Comp v-dynamicSlot.default="find">
      <template v-slot:default>
        <div>{{ v }}</div>
      </template>
    </Comp>
  </div>
</template>

<script setup lang="ts">
  import { VNode } from "vue";
  function find(vnode: VNode) {
    return {
      //Insert children subscript for reference
      referIndex: 1,
      //DynamicChildren Parent Box
      originInsetParentVnode: vnode,
    };
  }
</script>
```

### For more examples, see project example
