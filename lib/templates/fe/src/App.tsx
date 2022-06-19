import { Page } from '/componenst/Page'

import { HomePage } from '/pages/HomePage'

import styles from './App.scss'

export const App = () => (
  <>
    <header class={styles.header}>
      <a href="/" exact classes={styles}>Home</a>
      <a href="/settings" classes={styles}>Settings</a>
      <a href="/any-other" classes={styles}>404</a>
    </header>
    <main class={styles.main}>
      <router>
        <slot name='/'>
          <HomePage />
        </slot>
        <slot name='settings'>
          <Page>
            <div class={styles.content}>
              <h1>Settings</h1>
              This is an example of a page.
            </div>
          </Page>
        </slot>
        <Page>
          <div class={styles.content}>
            <h1 style=''>404</h1>
            Not Found
          </div>
        </Page>
      </router>
    </main>
  </>
)
