import { State } from 'watch-state'

import styles from './App.scss'

const name = new State('World')

export const App = () => (
  <div class={styles.root}>
    <h1 class={styles.header}>
      Hello{() => name.value ? `, ${name.value}` : ''}!
    </h1>
    <input
      class={styles.input}
      oninput={e => name.value = e.target.value}
      placeholder='Enter your name'
    />
  </div>
)
