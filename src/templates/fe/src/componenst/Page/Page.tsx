import { JsxComponent, useChildren } from '@innet/jsx'
import { Ref } from '@innet/dom'
import { State } from 'watch-state'
import classes from 'html-classes'

import styles from './Page.scss'

export const Page: JsxComponent = () => {
  const hidden = new Ref<State<boolean>>()

  return (
    <delay ref={hidden} show={300} hide={300}>
      <div class={() => classes(styles.root, hidden.value.value && styles.hidden)}>
        {useChildren()}
      </div>
    </delay>
  )
}
