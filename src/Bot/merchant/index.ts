import { ItemData } from 'alclient'
import { ToadScheduler, SimpleIntervalJob, Task } from 'toad-scheduler'
import Bot from '..'
import WithdrawItems from '../../Task/WithdrawItems.js'
import BankItems from '../../Task/BankItems.js'
import SellInStand from '../../Task/SellInStand.js'
import Gather from '../../Task/Gather.js'
import CombineBankItems from '../../Task/CombineBankItems.js'
import UpgradeBankItems from '../../Task/UpgradeBankItems.js'
import FindOrCraft from '../../Task/FindOrCraft.js'
import FindAndExchange from '../../Task/FindAndExchange.js'
import FindAndRecycle from '../../Task/FindAndRecycle.js'

const scheduler = new ToadScheduler()

async function preLoadFunctions (bot: Bot): Promise<void> {
}

async function loadFunctions (bot: Bot): Promise<void> {
  bot.elixirs = []
  bot.goldToHold = 10000000
  bot.itemsToHold = ['cscroll0', 'cscroll1', 'cscroll2', 'scroll0', 'scroll1', 'scroll2', 'stand0', 'rod', 'pickaxe']
  bot.loopOverrideList = ['MainLoop', 'ElixirLoop', 'JailLoop', 'PotionLoop', 'RespawnLoop', 'SellItemsLoop']
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

function queueTasks (bot: Bot, tasks: Array<any>, args) {
  const scheduleTasks = new Task('queueTasks', () => {
    tasks.forEach((task) => bot.queue.addTask(task))
  })

  const job = new SimpleIntervalJob(args, scheduleTasks)
  scheduler.addSimpleIntervalJob(job)
}

function scheduleBankTasks (bot: Bot): void {
  const bankArgs = { itemsToHold: bot.itemsToHold }
  const bankItemsTask = new BankItems(bot, 0, bot.getServerIdentifier(), bot.getServerRegion(), [], [], bankArgs)
  const CombineTask = new CombineBankItems(bot, 1, bot.getServerIdentifier(), bot.getServerRegion(), [bankItemsTask], [], {})
  const UpgradeTask = new UpgradeBankItems(bot, 1, bot.getServerIdentifier(), bot.getServerRegion(), [bankItemsTask], [], {})
  const FindAndExchangeTask = new FindAndExchange(bot, 1, bot.getServerIdentifier(), bot.getServerRegion(), [bankItemsTask], [], {})

  const findOrCraftItemsArgs = { items: bot.config.itemsToCraft }
  const findOrCraftItemsTask = new FindOrCraft(bot, 1, bot.getServerIdentifier(), bot.getServerRegion(), [bankItemsTask], [], findOrCraftItemsArgs)

  const findAndRecycleArgs = { items: bot.config.itemsToRecycle }
  const findAndRecycleTask = new FindAndRecycle(bot, 1, bot.getServerIdentifier(), bot.getServerRegion(), [bankItemsTask], [], findAndRecycleArgs)
  queueTasks(bot, [CombineTask, UpgradeTask, FindAndExchangeTask, findOrCraftItemsTask, findAndRecycleTask], { minutes: 10 })
}

function scheduleGatheringTasks (bot): void {
  const bankArgs = { itemsToHold: bot.itemsToHold }
  const bankItemsTask = new BankItems(bot, 0, bot.getServerIdentifier(), bot.getServerRegion(), [], [], bankArgs)

  const findOrCraftArgs = { items: [{ name: 'rod', q: 1, level: 0 }, { name: 'pickaxe', q: 1, level: 0 }], craftNotFound: true }
  const findOrCraftTask = new FindOrCraft(bot, 1, bot.getServerIdentifier(), bot.getServerRegion(), [bankItemsTask], [], findOrCraftArgs)

  const FishTask = new Gather(bot, 5, bot.getServerIdentifier(), bot.getServerRegion(), [findOrCraftTask], [], { type: 'fishing', craftNotFound: true })
  const MineTask = new Gather(bot, 5, bot.getServerIdentifier(), bot.getServerRegion(), [findOrCraftTask], [], { type: 'mining', craftNotFound: true })

  queueTasks(bot, [MineTask, FishTask], { minutes: 5 })
}

export default {
  load: loadFunctions,
  loop: loopFunctions,
  preLoad: preLoadFunctions
}
