import { Entity, IPosition, ItemName, ServerIdentifier, ServerRegion } from 'alclient'
import Party from '../Party'

export interface loop {
  status: 'started' | 'running' | 'stopping' | 'stopped'
  loopFunction: Promise<void> | undefined
  start: Function
  stop: Function
  loop: Function
}

export type Strategies = {
  move: any
  defence: any,
  attack: any
}

export type botConfig = {
  pathFinderOptions: {[key: string]: string}
  itemsToSell: Array<{ name: ItemName, level?: number}>,
  itemsToExchange: Array<{ name: ItemName, level?: number}>,
  itemsToCraft: Array<ItemName>
  itemsToRecycle: Array<ItemName>
  monsters: {
    noSolo: Array<string>,
    special: Array<string>,
    monsterHuntExclude: Array<string>
    strategies: {[key: string]: {
      move: string,
      attack: string,
      defence: string
    }}
  },
  merchantSaleItems: Array<{name: ItemName, level: number, price: number, q: number}>
}

export type BotParams = {
  characterName: string,
  characterClass: string,
  defaultRegionName: ServerRegion,
  defaultRegionIdentifier: ServerIdentifier,
  logger: any,
  monster: string
  config: botConfig,
  party: Party
}

export type taskArgs = {
  [key: string]: any,
  targetData?: Entity,
  rallyPosition?: IPosition
}
