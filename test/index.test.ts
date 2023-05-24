import type { FunctionalComponent as FC } from 'preact'

import './setup.js'
import { STORE_UNMOUNT_DELAY, onMount, atom, map } from 'nanostores'
import { render, screen, act } from '@testing-library/preact'
import { equal, is } from 'uvu/assert'
import { useState } from 'preact/hooks'
import { delay } from 'nanodelay'
import { test } from 'uvu'
import { h } from 'preact'

import { useStore } from '../index.js'

test.after.each(() => {
  window.document.head.innerHTML = ''
  window.document.body.innerHTML = '<main></main>'
})

test('renders simple store', async () => {
  let events: string[] = []
  let renders = 0

  let letter = atom<string>('')

  onMount(letter, () => {
    events.push('constructor')
    letter.set('a')
    return () => {
      events.push('destroy')
    }
  })

  let Test1: FC = () => {
    renders += 1
    let value = useStore(letter)
    // @ts-expect-error: Preact type issue with data-*
    return h('div', { 'data-testid': 'test1' }, value)
  }

  let Test2: FC = () => {
    let value = useStore(letter)
    // @ts-expect-error: Preact type issue with data-*
    return h('div', { 'data-testid': 'test2' }, value)
  }

  let Wrapper: FC = () => {
    let [show, setShow] = useState<boolean>(true)
    return h(
      'div',
      {},
      h('button', {
        onClick: () => {
          setShow(false)
        }
      }),
      show && h(Test1, null),
      show && h(Test2, null)
    )
  }

  render(h(Wrapper, null))
  equal(events, ['constructor'])
  equal(screen.getByTestId('test1').textContent, 'a')
  equal(screen.getByTestId('test2').textContent, 'a')
  equal(renders, 1)

  await act(async () => {
    letter.set('b')
    letter.set('c')
    await delay(1)
  })

  equal(screen.getByTestId('test1').textContent, 'c')
  equal(screen.getByTestId('test2').textContent, 'c')
  equal(renders, 2)

  act(() => {
    screen.getByRole('button').click()
  })
  is(screen.queryByTestId('test'), null)
  equal(renders, 2)
  await delay(STORE_UNMOUNT_DELAY)

  equal(events, ['constructor', 'destroy'])
})

test('does not reload store on component changes', async () => {
  let destroyed = ''
  let simple = atom<string>('')

  onMount(simple, () => {
    simple.set('S')
    return () => {
      destroyed += 'S'
    }
  })

  let TestA: FC = () => {
    let simpleValue = useStore(simple)
    // @ts-expect-error: Preact type issue with data-*
    return h('div', { 'data-testid': 'test' }, `1 ${simpleValue}`)
  }

  let TestB: FC = () => {
    let simpleValue = useStore(simple)
    // @ts-expect-error: Preact type issue with data-*
    return h('div', { 'data-testid': 'test' }, `2 ${simpleValue}`)
  }

  let Switcher: FC = () => {
    let [state, setState] = useState<'a' | 'b' | 'none'>('a')
    if (state === 'a') {
      return h(
        'div',
        {},
        h('button', {
          onClick: () => {
            setState('b')
          }
        }),
        h(TestA, null)
      )
    } else if (state === 'b') {
      return h(
        'div',
        {},
        h('button', {
          onClick: () => {
            setState('none')
          }
        }),
        h(TestB, null)
      )
    } else {
      return null
    }
  }

  render(h(Switcher, null))
  equal(screen.getByTestId('test').textContent, '1 S')

  act(() => {
    screen.getByRole('button').click()
  })
  equal(screen.getByTestId('test').textContent, '2 S')
  equal(destroyed, '')

  act(() => {
    screen.getByRole('button').click()
  })
  is(screen.queryByTestId('test'), null)
  equal(destroyed, '')

  await delay(STORE_UNMOUNT_DELAY)
  equal(destroyed, 'S')
})

test('has keys option', async () => {
  type MapStore = {
    a?: string
    b?: string
  }
  let Wrapper: FC = ({ children }) => h('div', {}, children)
  let mapSore = map<MapStore>()
  let renderCount = 0
  let MapTest: FC = () => {
    renderCount++
    let [keys, setKeys] = useState<(keyof MapStore)[]>(['a'])
    let { a, b } = useStore(mapSore, { keys })
    return h(
      // @ts-expect-error: Preact type issue with data-*
      'div',
      { 'data-testid': 'map-test' },
      h('button', {
        onClick: () => {
          setKeys(['a', 'b'])
        }
      }),
      `map:${a}-${b}`
    )
  }

  render(h(Wrapper, {}, h(MapTest, {})))

  equal(screen.getByTestId('map-test').textContent, 'map:undefined-undefined')
  equal(renderCount, 1)

  // updates on init
  await act(async () => {
    mapSore.set({ a: undefined, b: undefined })
    await delay(1)
  })

  equal(screen.getByTestId('map-test').textContent, 'map:undefined-undefined')
  equal(renderCount, 2)

  // updates when has key
  await act(async () => {
    mapSore.setKey('a', 'a')
    await delay(1)
  })

  equal(screen.getByTestId('map-test').textContent, 'map:a-undefined')
  equal(renderCount, 3)

  // does not update when has no key
  await act(async () => {
    mapSore.setKey('b', 'b')
    await delay(1)
  })

  equal(screen.getByTestId('map-test').textContent, 'map:a-undefined')
  equal(renderCount, 3)

  // reacts on parameter changes
  await act(async () => {
    screen.getByRole('button').click()
    await delay(1)
  })

  equal(screen.getByTestId('map-test').textContent, 'map:a-b')
  equal(renderCount, 4)
})

test('return correct value for Atom, if store was changed between rendering and useEffect', async () => {
  let store = atom<'old' | 'new'>('old')

  let renderWithMutate = (value: string): string => {
    store.get() !== 'new' && store.set('new')
    return value
  }

  let Wrapper: FC = () => {
    let value = useStore(store)
    return h('p', {}, renderWithMutate(value))
  }

  render(h(Wrapper, null))

  let result = screen.getByText('new').textContent
  equal(result, 'new')
})

test('return correct value for MapStore, if store was changed between rendering and useEffect', async () => {
  let store = map<{ value: 'old' | 'new' }>({ value: 'old' })

  let renderWithMutate = (value: string): string => {
    store.get().value !== 'new' && store.setKey('value', 'new')
    return value
  }

  let Wrapper: FC = () => {
    let value = useStore(store).value
    return h('p', {}, renderWithMutate(value))
  }

  render(h(Wrapper, null))

  let result = screen.getByText('new').textContent
  equal(result, 'new')
})

test.run()
