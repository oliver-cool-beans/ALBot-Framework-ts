import KiteTarget from './KiteTarget.js'
import SafeAttack from './SafeAttack.js'
import AttackTankTarget from './AttackTankTarget.js'
import CBurstPull from './CBurstPull.js'
import DoNothing from './DoNothing.js'
import PartyPull from './PartyPull.js'
import KiteInCircle from './KiteInCircle.js'

export const moveStrategies = {
  kiteTarget: KiteTarget,
  doNothing: DoNothing,
  kiteInCircle: KiteInCircle
}

export const attackStrategies = {
  safeAttack: SafeAttack,
  attackTankTarget: AttackTankTarget,
  cburstPull: CBurstPull,
  doNothing: DoNothing,
  partyPull: PartyPull
}

export const defenceStrategies = {
  doNothing: DoNothing
}
