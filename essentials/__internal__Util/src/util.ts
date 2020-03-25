/**
 * Failsover to the next RPC node
 * @param rpc_nodes Array of all nodes
 * @param current_rpc_node Current node
 */
export const failover_node = (
  rpc_nodes: Array<string>,
  current_rpc_node: string,
) => {
  if (rpc_nodes && rpc_nodes.length > 1) {
    let index: number = rpc_nodes.indexOf(current_rpc_node) + 1
    if (index === rpc_nodes.length) index = 0
    current_rpc_node = rpc_nodes[index]
  }
  return current_rpc_node
}

/**
 * Shifts the active signing-key to the first spot
 */
export const order_keys = (
  signing_keys: Array<{public: string; private: string}>,
  key: string,
) => {
  for (const k of signing_keys) {
    if (k.public === key) {
      const i = signing_keys.indexOf(k)
      signing_keys.splice(i, 1)
      signing_keys.unshift(k)
    }
  }
  return signing_keys
}

/**
 * Gets the next signing-key or the disable-key
 * @param signing_keys Array of all signing-keys
 * @param signing_key Current signing-key
 * @param infinite Should it start from the beginning if end of array is reached?
 */
export const get_next_key = (
  signing_keys: Array<{public: string; private: string}>,
  key: string,
  infinite = false,
): {public: string; private: string} => {
  const keypair = signing_keys.filter((x) => x.public === key)[0]
  const i = signing_keys.indexOf(keypair)
  if (i >= signing_keys.length - 1) {
    if (infinite) {
      return signing_keys[0]
    } else {
      return {public: 'STM1111111111111111111111111111111114T1Anm', private: ''}
    }
  } else {
    return signing_keys[i + 1]
  }
}

/**
 * Chooses private key out of the given signing key pairs & active key
 * @param current_key Current Signing Key
 * @param signing_keys All Signing Key Pairs [{ public: 'STM7..', private: '5JS..' }, { .. }]
 */
export const choose_transaction_key = (
  current_key: string,
  active_key: string,
  signing_keys: Array<{public: string; private: string}> = [],
) => {
  if (signing_keys.length > 0) {
    if (current_key.slice(-39) === '1111111111111111111111111111111114T1Anm') {
      return active_key ? active_key : ''
    }
    for (const key of signing_keys) {
      if (current_key == key.public) {
        return key.private ? key.private : active_key ? active_key : ''
      }
    }
  }
  return active_key ? active_key : ''
}

export const log = (...args) => {
  console.log(`${new Date().toISOString()} - ${args}`)
}

export const timeout = (sec) => {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000))
}

export const convert_nai_precision = (amount, precision) => {
  return (Number.parseFloat(amount) / 10 ** precision).toFixed(3)
}
