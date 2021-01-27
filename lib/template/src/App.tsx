import innet from 'innet'
import {state} from 'watch-state'

import styles from './App.scss'

class App {
  @state name = 'World'

  render () {
    return (
      <div class={styles.root}>
        <h1 class={styles.header}>
          Hello{() => this.name ? `, ${this.name}` : ''}!
        </h1>
        <input
          class={styles.input}
          oninput={e => this.name = e.target.value}
          placeholder='Enter your name'
        />
      </div>
    )
  }
}

export default App
