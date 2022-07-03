import { ItemData } from 'alclient'
import Bot from '..'
import WithdrawItems from '../../Task/WithdrawItems.js'
import BankItems from '../../Task/BankItems.js'
import SellInStand from '../../Task/SellInStand.js'
import Gather from '../../Task/Gather.js'
import schedule from 'node-schedule'
import CombineBankItems from '../../Task/CombineBankItems.js'
import UpgradeBankItems from '../../Task/UpgradeBankItems.js'
import BuyItems from '../../Task/BuyItems.js'

async function preLoadFunctions (bot: Bot): Promise<void> {
}

async function loadFunctions (bot: Bot): Promise<void> {
  bot.elixirs = []
  bot.goldToHold = 10000000
  bot.itemsToHold = ['cscroll0', 'cscroll1', 'cscroll2', 'scroll0', 'scroll1', 'scroll2', 'stand0', 'rod', 'pickaxe']
  bot.loopOverrideList = ['MainLoop', 'ElixirLoop', 'JailLoop', 'PotionLoop', 'RespawnLoop']
  const bankArgs = { itemsToHold: bot.itemsToHold }
  const bankItemsTask = new BankItems(bot, 0, bot.getServerIdentifier(), bot.getServerRegion(), [], [], bankArgs)

  const items: Array<ItemData> = bot.config.merchantSaleItems || []
  const withdrawArgs = { items: items.concat({ name: 'stand0' }) }
  const withdrawItemsTask = new WithdrawItems(bot, 0, bot.getServerIdentifier(), bot.getServerRegion(), [], [], withdrawArgs)

  const sellInStandArgs = { itemsToSell: items }
  const onStartTasks = [bankItemsTask, withdrawItemsTask]
  const sellInStandTask = new SellInStand(bot, 99, bot.getServerIdentifier(), bot.getServerRegion(), onStartTasks, [], sellInStandArgs)
  bot.queue.addTask(sellInStandTask)
  scheduleGatheringTasks(bot)
  scheduleBankTasks(bot)
}

async function loopFunctions (bot: Bot): Promise<void> {
}

function scheduleBankTasks (bot): void {
  const bankArgs = { itemsToHold: bot.itemsToHold }
  const bankItemsTask = new BankItems(bot, 0, bot.getServerIdentifier(), bot.getServerRegion(), [], [], bankArgs)
  const combineTask = new CombineBankItems(bot, 1, bot.getServerIdentifier(), bot.getServerRegion(), [bankItemsTask], [], {})
  const upgradeTask = new UpgradeBankItems(bot, 1, bot.getServerIdentifier(), bot.getServerRegion(), [bankItemsTask], [], {})

  const buyTaskArgs = { itemsToBuy: bot.config.itemsToBuy || [] }
  const buyTask = new BuyItems(bot, 1, bot.getServerIdentifier(), bot.getServerRegion(), [], [], buyTaskArgs)

  schedule.scheduleJob('*/15 * * * *', () => bot.queue.addTask(buyTask))
  schedule.scheduleJob('*/16 * * * *', () => bot.queue.addTask(upgradeTask))
  schedule.scheduleJob('*/17 * * * *', () => bot.queue.addTask(combineTask))
  bot.queue.addTask(upgradeTask)
  bot.queue.addTask(combineTask)
}

function scheduleGatheringTasks (bot): void {
  const fishArgs = { items: [{ name: 'rod' }] }
  const mineArgs = { items: [{ name: 'pickaxe' }] }
  const fishWithdrawTask = new WithdrawItems(bot, 99, bot.getServerIdentifier(), bot.getServerRegion(), [], [], fishArgs)
  const mineWithdrawTask = new WithdrawItems(bot, 99, bot.getServerIdentifier(), bot.getServerRegion(), [], [], mineArgs)

  const FishTask = new Gather(bot, 5, bot.getServerIdentifier(), bot.getServerRegion(), [fishWithdrawTask], [], { type: 'fishing' })
  const MineTask = new Gather(bot, 5, bot.getServerIdentifier(), bot.getServerRegion(), [mineWithdrawTask], [], { type: 'mining' })
  bot.queue.addTask(MineTask)
  schedule.scheduleJob('*/5 * * * *', () => bot.queue.addTask(FishTask))
  schedule.scheduleJob('*/5 * * * *', () => bot.queue.addTask(MineTask))
}

export default {
  load: loadFunctions,
  loop: loopFunctions,
  preLoad: preLoadFunctions
}
