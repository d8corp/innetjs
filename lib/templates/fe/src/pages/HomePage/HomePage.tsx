import { JsxComponent } from '@innet/jsx'
import { State } from 'watch-state'

import { Page } from '/componenst/Page'

import styles from './HomePage.scss'

const name = new State('World')

export const HomePage: JsxComponent = () => (
  <Page>
    <div class={styles.root}>
      <h1 class={styles.header}>
        Hello{() => name.value ? `, ${name.value}` : ''}!
      </h1>
      <input
        class={styles.input}
        value={() => name.value}
        oninput={e => name.value = e.target.value}
        placeholder='Enter your name'
      />
    </div>
  </Page>
)
