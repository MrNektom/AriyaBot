import { Client, Intents } from "discord.js"
import { access, readFile, writeFile } from "fs/promises"
let bot = new Client({
  intents:[
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES
  ]
})
import { commList } from "./commands/index.js"
import readline from "readline/promises"
let rl = readline.createInterface(process.stdin,process.stdout)



let data = null
let config = null
try {
  await access("./config.json")
  config = await readFile("./config.json");
  config = JSON.parse(config)
} catch {
  config = {};
}
try {
  await access("./data.json")
  data = JSON.parse(await readFile("./data.json"))
  
} catch {
  data = {}
  await writeFile("./data.json",JSON.stringify(data),{flag:"w+"})
}

rl.on("SIGINT",async ()=>{
  let e = await rl.question("Do you want exit from this process?(y/n)")
  if(e!=="y")return;
  await writeFile("./config.json",JSON.stringify(config),{flag:"w+"})
  console.log("Saving config.json")
  await writeFile("./data.json",JSON.stringify(data),{flag:"w+"})
  console.log("Saving data.json")
  await bot.destroy()
  process.exit(0)
})
process.on("exit",()=>{
  console.log("exit")
})

let ready = false


// console.log(commList)

bot.on("ready",async ()=>{
  console.log(bot.user.username);
  ready= true

  let guilds = await bot.guilds.fetch()
  let comms = await bot.application.commands.fetch()

  // console.log(comms)
  for(let [id, c] of comms){
    let comm = commList.find(elem=>elem.name===c.name?elem:undefined)
    if(comm && !c.equals(comm)){
      console.log(`Editing command: ${c.name}`)
      await c.edit(comm)
    }else if(!comm){
      console.log(`Deleting command: ${c.name}`)
      await c.delete()
    }
  }

  comms = await bot.application.commands.fetch()

  for(let comm of commList){
    let c = comms.find(elem=>elem.name===comm.name)
    if(!c){
      console.log(`Creating command: ${comm.name}`)
		    try {
		      await bot.application.commands.create(comm)
		      console.log(`Command "${comm.name}" created`)
		    } catch (err){
		    	console.log(`Falling to create command: ${comm.name}`)
		    	console.log(err)
		    }
		}
		// console.log(c)
	}
	
	// comms = await bot.application.commands.set(commList)
	// console.log(comms)
	/*let c = await bot.application.commands.create({
		name:"help",
		description:"Shows info"
	})
	console.log(c)*/
})

bot.on("messageCreate",msg => {
  
  
  if(msg.author.id!=bot.user.id){
  	// msg.channel.send(msg.content)
  }
})

bot.on("interactionCreate",async (i) => {
  if(i.isCommand){
    let c = commList.find(elem=>elem.name==i.commandName?elem:undefined)
    if(c){
      try {
      	c.callback(i,data)
      } catch (err){
      	console.error(err)
      	i.reply("```\nError:"+err+"```")
      }
    } else {
      i.reply("Command not found")
    }
  }
})


rl.on("line", async (line)=>{
	if(ready&&line!==""){
		let channel = await bot.channels.fetch("901091663844376576")
		channel.send(line.trim())
	}
})



if(!config.token){
  
  console.log("Token not found")
  let counter = 10
  while(true){
    counter--;
    if(!counter)break;
    try {
      let token = await rl.question("Please enter your token: ")
      if(!token.length)console.log("Recived empty token")
      if(!token.length)continue;
      bot.login(token)
      config.token = token
      break;
    } catch (err){
      console.error(err)
    }
    
  }
} else {
	bot.login(config.token)
}

