import { Page } from '../Page'

import appStyles from './App.css'

export function App () {
  return (
    <Page title='innetjs application' styles={appStyles}>
      <div class='root'>
        <h1 class='header'>
          Welcome to the innet application!
        </h1>
      </div>
    </Page>
  )
}
