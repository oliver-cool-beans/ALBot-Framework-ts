import Crabxx from './Crabxx.js'
import DefaultMonsterHandler from './DefaultMonsterHandler.js'
import { BigBird } from './BigBird.js'
import Franky from './Franky.js'
import IceGolem from './IceGolem.js'
import Snowman from './Snowman.js'

const monsters = {
  DefaultMonsterHandler,
  franky: Franky,
  icegolem: IceGolem,
  crabxx: Crabxx,
  snowman: Snowman,
  bigbird: BigBird
}

export default monsters
