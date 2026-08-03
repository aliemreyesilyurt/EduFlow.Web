import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setAuthExpiredHandler } from './api/http'

const app = createApp(App)

app.use(createPinia())
app.use(router)

setAuthExpiredHandler(() => {
  router.push({ name: 'login' })
})

app.mount('#app')
