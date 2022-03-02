import pageStyles from './Page.css'

export function Page ({ title, styles }, children) {
  return (
    <header name='content-type' value='text/html; charset=utf-8'>
      <html lang='ru'>
        <head>
          <meta charset="UTF-8"/>
          <meta
            name="viewport"
            content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
          />
          <meta http-equiv="X-UA-Compatible" content="ie=edge"/>
          <style>{pageStyles}</style>
          <style>{styles}</style>
          <title>{title}</title>
        </head>
        <body>
          {children}
        </body>
      </html>
    </header>
  )
}
