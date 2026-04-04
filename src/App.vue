<template>
  <div class="app">
    <header class="topbar">
      <div class="topbarInner">
        <span class="brand">装修模拟器</span>
        <nav class="nav" aria-label="主导航">
          <RouterLink class="navLink" to="/" exact-active-class="active">户型布置</RouterLink>
          <RouterLink class="navLink" to="/budget" active-class="active">预算计算器</RouterLink>
        </nav>
      </div>
    </header>
    <RouterView class="routeView" />
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped>
.app {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  background: #f6f7fb;
  color: #111827;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.topbarInner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  max-width: 960px;
  margin: 0 auto;
}

.brand {
  font-weight: 800;
  font-size: 16px;
}

.nav {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.navLink {
  text-decoration: none;
  font-weight: 700;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 10px;
  color: rgba(17, 24, 39, 0.75);
  border: 1px solid transparent;
}

.navLink:hover {
  background: rgba(0, 0, 0, 0.04);
}

.navLink.active {
  border-color: rgba(0, 140, 255, 0.35);
  background: rgba(0, 140, 255, 0.12);
  color: #0070f3;
}

.routeView {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
