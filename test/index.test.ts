import './setup.js'

import { act, render, screen } from '@testing-library/preact'
import { delay } from 'nanodelay'
import { atom, map, onMount, STORE_UNMOUNT_DELAY } from 'nanostores'
import { deepStrictEqual, equal } from 'node:assert'
import { afterEach, test } from 'node:test'
import type { FunctionalComponent as FC } from 'preact'
import { h } from 'preact'
import { useState } from 'preact/hooks'

import { useStore } from '../index.js'

afterEach(() => {
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
    return h('div', { 'data-testid': 'test1' }, value)
  }

  let Test2: FC = () => {
    let value = useStore(letter)
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
  deepStrictEqual(events, ['constructor'])
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
  equal(screen.queryByTestId('test'), null)
  equal(renders, 2)
  await delay(STORE_UNMOUNT_DELAY)

  deepStrictEqual(events, ['constructor', 'destroy'])
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
    return h('div', { 'data-testid': 'test' }, `1 ${simpleValue}`)
  }

  let TestB: FC = () => {
    let simpleValue = useStore(simple)
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
  equal(screen.queryByTestId('test'), null)
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

test('supports atom changes between rendering and useEffect', () => {
  let store = atom<'new' | 'old'>('old')

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

test('supports map changes between rendering and useEffect', () => {
  let store = map<{ value: 'new' | 'old' }>({ value: 'old' })

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
