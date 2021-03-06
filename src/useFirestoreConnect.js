import { isEqual } from 'lodash'
import { useRef, useMemo, useEffect } from 'react'
import { invokeArrayQuery, getChanges } from './utils'
import useFirestore from './useFirestore'

/**
 * @description React hook that automatically listens/unListens
 * to provided Cloud Firestore paths. Make sure you have required/imported
 * Cloud Firestore, including it's reducer, before attempting to use.
 * Populate is supported for Firestore as of v0.6.0 of redux-firestore (added
 * [as part of issue #48](https://github.com/prescottprue/redux-firestore/issues/48)).
 * @param {object|string|Array|Function} queriesConfigs - An object, string,
 * or array of object or string for paths to sync from firestore. Can also be
 * a function that returns the object, string, or array of object or string.
 * @see https://react-redux-firebase.com/docs/api/useFirestoreConnect.html
 * @example <caption>Basic</caption>
 * import React from 'react'
 * import { useSelector } from 'react-redux'
 * import { useFirestoreConnect } from 'react-redux-firebase'
 *
 * export default function TodosList() {
 *   useFirestoreConnect(['todos']) // sync todos collection from Firestore into redux
 *   const todos = useSelector(state => state.firestore.data.todos)
 *   return (
 *     <ul>
 *       {todos &&
 *         todos.map((todo) => (
 *           <li>id: {todo.id} todo: {todo.description}</li>
 *         ))}
 *    </ul>
 *   )
 * }
 * @example <caption>Object as query</caption>
 * import React from 'react'
 * import { useSelector } from 'react-redux'
 * import { useFirestoreConnect } from 'react-redux-firebase'
 *
 * export default function TodoItem({ todoId }) {
 *   useFirestoreConnect([{
 *     collection: 'todos',
 *     doc: todoId
 *   }])
 *   const todo = useSelector(
 *     ({ firestore: { data } }) => data.todos && data.todos[todoId]
 *   )
 *
 *   return <div>{JSON.stringify(todo)}</div>
 * }
 */
export default function useFirestoreConnect(queriesConfigs) {
  const firestore = useFirestore()
  const firestoreIsEnabled = !!firestore
  const queryRef = useRef()

  const data = useMemo(() => invokeArrayQuery(queriesConfigs), [queriesConfigs])

  useEffect(() => {
    if (firestoreIsEnabled && !isEqual(data, queryRef.current)) {
      const changes = getChanges(data, queryRef.current)

      queryRef.current = data

      // Remove listeners for inactive subscriptions
      firestore.unsetListeners(changes.removed)

      // Add listeners for new subscriptions
      firestore.setListeners(changes.added)
    }
  }, [data])

  // Emulate componentWillUnmount
  useEffect(() => {
    return () => {
      if (firestoreIsEnabled && queryRef.current) {
        firestore.unsetListeners(queryRef.current)
      }
    }
  }, [])
}
