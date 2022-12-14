import React from 'react'
import dedent from 'dedent-js'
import { Code, CodeBlock, H1, H2, Layout, Notice, P, TabbedCode } from '@/Components'

const meta = {
  title: 'Partial reloads',
  links: [
    { url: '#top', name: 'Introduction' },
    { url: '#making-partial-visits', name: 'Making partial visits' },
    { url: '#lazy-data-evaluation', name: 'Lazy data evaluation' },
  ],
}

const Page = () => {
  return (
    <>
      <H1>Partial reloads</H1>
      <P>
        When making visits to the same page, it's not always necessary to fetch all of the data required for that page
        from the server again. In fact, selecting only a subset of the data can be a helpful performance optimization if
        it's acceptable that some page data becomes stale. This is possible to do in Inertia with the "partial reloads"
        feature.
      </P>
      <P>
        As an example, consider a user index page that includes a list of users, as well as an option to filter the
        users by their company. On the first request to the user index page both the <Code>users</Code> and{' '}
        <Code>companies</Code> data is passed to the page component. However, on subsequent visits to the same page
        (maybe to filter the users), you can request only the <Code>users</Code> data from the server, and not the{' '}
        <Code>companies</Code> data. Inertia will then automatically merge the partial data returned from the server
        with the data it already has in memory client-side.
      </P>
      <Notice>Partial reloads only work for visits made to the same page component.</Notice>
      <H2>Making partial visits</H2>
      <P>
        To perform a partial reload, use the <Code>only</Code> property to set which data you want returned from the
        server. This takes an array of keys, which corresponds to the keys of the props.
      </P>
      <CodeBlock
        language="js"
        children={dedent`
          import { Inertia } from '@inertiajs/inertia'\n
          Inertia.visit(url, {
            only: ['users'],
          })
        `}
      />
      <P>
        Since partial reloads can only be made to the same page component, it almost always makes sense to just use the{' '}
        <Code>Inertia.reload()</Code> method, which automatically uses the current URL.
      </P>
      <CodeBlock
        language="js"
        children={dedent`
          import { Inertia } from '@inertiajs/inertia'\n
          Inertia.reload({ only: ['users'] })
        `}
      />
      <P>
        It's also possible to perform partial reloads with Inertia links using the <Code>only</Code> property.
      </P>
      <TabbedCode
        examples={[
          {
            name: 'Vue 2',
            language: 'jsx',
            code: dedent`
              import { Link } from '@inertiajs/inertia-vue'\n
              <Link href="/users?active=true" :only="['users']">Show active</Link>
            `,
          },
          {
            name: 'Vue 3',
            language: 'jsx',
            code: dedent`
              import { Link } from '@inertiajs/inertia-vue3'\n
              <Link href="/users?active=true" :only="['users']">Show active</Link>
            `,
          },
          {
            name: 'React',
            language: 'jsx',
            code: dedent`
              import { Link } from '@inertiajs/inertia-react'\n
              <Link href="/users?active=true" only={['users']}>Show active</Link>
            `,
          },
          {
            name: 'Svelte',
            language: 'jsx',
            code: dedent`
              import { inertia, Link } from '@inertiajs/inertia-svelte'\n
              <a href="/users?active=true" use:inertia="{{ only: ['users'] }}">Show active</a>\n
              <Link href="/users?active=true" only={['users']}>Show active</Link>
            `,
          },
        ]}
      />
      <H2>Lazy data evaluation</H2>
      <P>
        For partial reloads to be most effective, be sure to also use lazy data evaluation server-side. This is done by
        wrapping all optional page data in a closure.
      </P>
      <P>
        When Inertia performs a visit, it will determine which data is required, and only then will it evaluate the
        closure. This can significantly increase the performance of pages with a lot of optional data.
      </P>
      <TabbedCode
        examples={[
          {
            name: 'Laravel',
            language: 'php',
            code: dedent`
              return Inertia::render('Users/Index', [\n
                  // ALWAYS included on first visit
                  // OPTIONALLY included on partial reloads
                  // ALWAYS evaluated
                  'users' => User::get(),\n
                  // ALWAYS included on first visit
                  // OPTIONALLY included on partial reloads
                  // ONLY evaluated when needed
                  'users' => fn () => User::get(),\n
                  // NEVER included on first visit
                  // OPTIONALLY included on partial reloads
                  // ONLY evaluated when needed
                  'users' => Inertia::lazy(fn () => User::get()),
              ]);
            `,
          },
          {
            name: 'Rails',
            language: 'ruby',
            code: dedent`
              class UsersController < ApplicationController
                def index
                  render inertia: 'Users/Index', props: {\n
                    # ALWAYS included on first visit
                    # OPTIONALLY included on partial reloads
                    # ALWAYS evaluated
                    users: User.as_json()\n
                    # ALWAYS included on first visit
                    # OPTIONALLY included on partial reloads
                    # ONLY evaluated when needed
                    users: -> { User.as_json() },\n
                    # NEVER included on first visit
                    # OPTIONALLY included on partial reloads
                    # ONLY evaluated when needed
                    users: InertiaRails.lazy(-> { User.as_json }),
                  }
                end
              end
            `,
          },
        ]}
      />
    </>
  )
}

Page.layout = page => <Layout children={page} meta={meta} />

export default Page
