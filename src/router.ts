import { createRouter, createWebHistory } from 'vue-router'
import FloorplanView from './views/FloorplanView.vue'
import BudgetCalculatorView from './views/BudgetCalculatorView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'floorplan', component: FloorplanView },
    { path: '/budget', name: 'budget', component: BudgetCalculatorView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
