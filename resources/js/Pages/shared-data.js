import React from 'react'
import dedent from 'dedent-js'
import { H1, H2, Layout, Notice, P, TabbedCode } from '@/Components'

const meta = {
  title: 'Shared data',
  links: [
    { url: '#top', name: 'Introduction' },
    { url: '#sharing-data', name: 'Sharing data' },
    { url: '#accessing-shared-data', name: 'Accessing shared data' },
    { url: '#flash-messages', name: 'Flash messages' },
  ],
}

const Page = () => {
  return (
    <>
      <H1>Shared data</H1>
      <P>
        Sometimes you need to access certain data on numerous pages within your application. For example, a common
        use-case for this is showing the current user in the site header. Passing this data manually in each response
        isn't practical. In these situations shared data can be useful.
      </P>
      <H2>Sharing data</H2>
      <P>
        The server-side adapters provide a way to preassign shared data for each request. This is typically done outside
        of your controllers. Shared data will be automatically merged with the page props provided in your controller.
      </P>
      <TabbedCode
        examples={[
          {
            name: 'Laravel',
            language: 'php',
            code: dedent`
              /*
              |----------------------------------------------------------------
              | Via the HandleInertiaRequests middleware (recommended)
              |----------------------------------------------------------------
              */\n
              class HandleInertiaRequests extends Middleware
              {
                  public function share(Request $request)
                  {
                      return array_merge(parent::share($request), [\n
                          // Synchronously
                          'appName' => config('app.name'),\n
                          // Lazily
                          'auth.user' => fn () => $request->user()
                              ? $request->user()->only('id', 'name', 'email')
                              : null,
                      ]);
                  }
              }\n
              /*
              |----------------------------------------------------------------
              | Manually
              |----------------------------------------------------------------
              */\n
              use Inertia\\Inertia;\n
              // Synchronously
              Inertia::share('appName', config('app.name'));\n
              // Lazily
              Inertia::share('user', fn (Request $request) => $request->user()
                  ? $request->user()->only('id', 'name', 'email')
                  : null
              );
            `,
            description:
              'The HandleInertiaRequests middleware provides a "share" method where you can define the data that is automatically shared with each Inertia response.',
          },
          {
            name: 'Rails',
            language: 'ruby',
            code: dedent`
              # Synchronously
              inertia_share app_name: env['app.name']\n
              # Lazily
              inertia_share do
                if logged_in?
                  {
                    'auth.user' => {id: logged_in_user.id}
                  }
                end
              end\n
              # Lazily
              inertia_share user_count: lambda { User.count }
            `,
          },
        ]}
      />
      <Notice>Use this feature sparingly as shared data is included with every response.</Notice>
      <Notice>
        Page props and shared data are merged together, so be sure to namespace your shared data appropriately.
      </Notice>
      <H2>Accessing shared data</H2>
      <P>
        Once you've shared the data server-side, you'll then be able to access it within your page components as props.
        Shared data can even be accessed in non-page components, although not as props in those cases. Here's an example
        of how to do this in a layout component.
      </P>
      <TabbedCode
        examples={[
          {
            name: 'Vue 2',
            language: 'twig',
            code: dedent`
              <template>
                <main>
                  <header>
                    You are logged in as: {{ user.name }}
                  </header>
                  <content>
                    <slot />
                  </content>
                </main>
              </template>\n
              <script>
              export default {
                computed: {
                  user() {
                    return this.$page.props.auth.user
                  }
                }
              }
              </script>
            `,
            description: 'Access shared data using the $page property.',
          },
          {
            name: 'Vue 3',
            language: 'twig',
            code: dedent`
              <template>
                <main>
                  <header>
                    You are logged in as: {{ user.name }}
                  </header>
                  <content>
                    <slot />
                  </content>
                </main>
              </template>\n
              <script>
              import { computed } from 'vue'
              import { usePage } from '@inertiajs/inertia-vue3'\n
              export default {
                setup() {
                  const user = computed(() => usePage().props.value.auth.user)
                  return { user }
                },
              }
              </script>
            `,
            description: 'Access shared data using the $page property or the usePage() hook.',
          },
          {
            name: 'React',
            language: 'jsx',
            code: dedent`
              import { usePage } from '@inertiajs/inertia-react'\n
              export default function Layout({ children }) {
                const { auth } = usePage().props\n
                return (
                  <main>
                    <header>
                      You are logged in as: {auth.user.name}
                    </header>
                    <content>
                      {children}
                    </content>
                  </main>
                )
              }
            `,
            description: 'Access shared data using the usePage() hook.',
          },
          {
            name: 'Svelte',
            language: 'html',
            code: dedent`
              <script>
                import { page } from '@inertiajs/inertia-svelte'
              </script>\n
              <main>
                <header>
                  You are logged in as: {$page.props.auth.user.name}
                </header>
                <content>
                  <slot />
                </content>
              </main>
            `,
            description: 'Access shared data using the $page store.',
          },
        ]}
      />
      <H2>Flash messages</H2>
      <P>
        Another great use-case for shared data is flash messages. These are messages stored in the session only for the
        next request. You'll often set a flash message after completing a task and before redirecting to a different
        page.
      </P>
      <P>
        Here's a simple way to implement flash messages in your Inertia applications. First, share the flash message on
        each request.
      </P>
      <TabbedCode
        examples={[
          {
            name: 'Laravel',
            language: 'php',
            code: dedent`
              class HandleInertiaRequests extends Middleware
              {
                  public function share(Request $request)
                  {
                      return array_merge(parent::share($request), [
                          'flash' => [
                              'message' => fn () => $request->session()->get('message')
                          ],
                      ]);
                  }
              }
            `,
          },
          {
            name: 'Rails',
            language: 'ruby',
            code: dedent`
              class ApplicationController < ActionController::Base
                inertia_share flash: -> {
                  {
                    message: flash.notice
                  }
                }
              end
            `,
          },
        ]}
      />
      <P>Next, display the flash message in a front-end component, such as the site layout.</P>
      <TabbedCode
        examples={[
          {
            name: 'Vue 2',
            language: 'twig',
            code: dedent`
              <template>
                <main>
                  <header></header>
                  <content>
                    <div v-if="$page.props.flash.message" class="alert">
                      {{ $page.props.flash.message }}
                    </div>
                    <slot />
                  </content>
                  <footer></footer>
                </main>
              </template>
            `,
          },
          {
            name: 'Vue 3',
            language: 'twig',
            code: dedent`
              <template>
                <main>
                  <header></header>
                  <content>
                    <div v-if="$page.props.flash.message" class="alert">
                      {{ $page.props.flash.message }}
                    </div>
                    <slot />
                  </content>
                  <footer></footer>
                </main>
              </template>
            `,
          },
          {
            name: 'React',
            language: 'jsx',
            code: dedent`
              import { usePage } from '@inertiajs/inertia-react'\n
              export default function Layout({ children }) {
                const { flash } = usePage().props\n
                return (
                  <main>
                    <header></header>
                    <content>
                      {flash.message && (
                        <div class="alert">{flash.message}</div>
                      )}
                      {children}
                    </content>
                    <footer></footer>
                  </main>
                )
              }
            `,
          },
          {
            name: 'Svelte',
            language: 'html',
            code: dedent`
              <script>
                import { page } from '@inertiajs/inertia-svelte'
              </script>\n
              <main>
                <header></header>
                <content>
                  {#if $page.props.flash.message}
                    <div class="alert">{$page.props.flash.message}</div>
                  {/if}
                  <slot />
                </content>
                <footer></footer>
              </main>
            `,
          },
        ]}
      />
    </>
  )
}

Page.layout = page => <Layout children={page} meta={meta} />

export default Page
