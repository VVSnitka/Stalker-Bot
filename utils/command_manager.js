const usersManager = require("./users_manager.js");
const itemManager = require("./game/item_manager.js");
const extra = require("./extra/reactions.js");
const Discord = require("discord.js");

const extra_log = require("./extra/logger.js");
const logger = new extra_log(__filename);



class CommandManager {
    fastlogin = (msg)=>{
        let embed = new Discord.MessageEmbed();
            embed
                .setColor("#2f3136")
                .setAuthor("S.T.A.L.K.E.R RP",this.client.user.avatarURL())
                .setDescription(`К сожалению вы не вошли в систему!\nВы можете быстро ввойти в систему нажав на 🔐`);
            msg.channel.send(embed).then(bot_msg=>{
                bot_msg.react("🔐").then(my_react=>{
                    this.awaitReaction(bot_msg,msg.author,"🔐",
                        ()=>{
                            let name = msg.author.username
                            usersManager.register({
                                id:msg.author.id,
                                tag:msg.author.tag
                            },name,msg.author.avatarURL());
                            let embed = new Discord.MessageEmbed();
                            embed
                                .setColor("#2f3136")
                                .setAuthor("S.T.A.L.K.E.R RP",this.client.user.avatarURL())
                                .setImage("https://i.imgur.com/sMBguw1.png")
                                .setDescription(`Вы успешно зарегестрированы как \`${name}\``);
                            bot_msg.edit(embed)
                            my_react.remove(this.client.user);
                            my_react.remove(msg.author);
                        }
                    )
                })
                
            })
    }
    commands = {
        "войти":(msg)=>{
            let name = msg.content.split(" ");
            name = name.slice(1).join(" ")
            if(/[^А-Яа-я ]/.test(name)){
                var embed_error = new Discord.MessageEmbed()
                embed_error
                    .setColor("#2f3136")
                    .setAuthor("S.T.A.L.K.E.R RP",this.client.user.avatarURL())
                    .setDescription(`Только кирилица!`);
            
                msg.channel.send(embed_error);
                return
            }
            if(name == ""){
                var embed_error = new Discord.MessageEmbed()
                embed_error
                    .setColor("#2f3136")
                    .setAuthor("S.T.A.L.K.E.R RP",this.client.user.avatarURL())
                    .setDescription(`Пустой ник нельзя! :)`);
            
                msg.channel.send(embed_error);
                return
            }
            usersManager.register({
                id:msg.author.id,
                tag:msg.author.tag
            },name,msg.author.avatarURL());
            
            let embed = new Discord.MessageEmbed();
            embed
                .setColor("#2f3136")
                .setAuthor("S.T.A.L.K.E.R RP",this.client.user.avatarURL())
                .setImage("https://i.imgur.com/sMBguw1.png")
                .setDescription(`Вы успешно зарегестрированы как \`${name}\``);
            
            msg.channel.send(embed);
            
        },
        "инвентарь":(msg)=>{
            if(!usersManager.checkRegUser(msg.author.id)){
                this.fastlogin(msg)
                return
            }
            let player = usersManager.getPlayerFromId(msg.author.id);
            let inventory = player.inventory;

            let inv_text = [];

            inventory.bag.map((c,i)=>{
                inv_text[i] = `${i}. \`${c.name}\` *${c.stringMass}кг*`
            })

            let embed = new Discord.MessageEmbed();
            embed
                .setAuthor("Вещи",this.client.user.avatarURL())
                .setThumbnail(inventory.armor.icon)
                .addField("Надето",inventory.armor.name)
                .addField("В сумке",inv_text.join("\n"))
                .addField("Общая сумма",inventory.totalMass+"кг")
                .setColor("#2f3136")
            
            msg.channel.send(embed);
        },
        "профиль":(msg)=>{
            if(!usersManager.checkRegUser(msg.author.id)){
                this.fastlogin(msg)
                return
            }

            let player = usersManager.getPlayerFromId(msg.author.id);
            
            let embed = new Discord.MessageEmbed();
            embed
                .setColor("#2f3136")
                .setAuthor("ПДА: Ваш профиль",this.client.user.avatarURL())
                .addField("Кличка",player.person.name,true)
                .addField("Групировка","`Нереализовано`",true)
                .setThumbnail(player.person.icon)
            
            msg.channel.send(embed);
        },
        "локация":(msg)=>{
            if(!usersManager.checkRegUser(msg.author.id)){
                this.fastlogin(msg)
                return
            }

            let player = usersManager.getPlayerFromId(msg.author.id);
            let locations = player.allSubLocations;

            let str = [];
            locations.map((c,i)=>{
                str[i] = `${i}. \`${c.name}\``
            })

            let embed = new Discord.MessageEmbed();
            embed
                .setColor("#2f3136")
                .setAuthor("ПДА: Местоположение",this.client.user.avatarURL())
                .setDescription(`**${player.location.location.name}**\n   *${player.location.sublocation.name}*`)
                .addField("Отправится в:",str.join("\n"))
                .setFooter("Нажми на номер нужной локации")
            
            msg.channel.send(embed).then(msg_bot=>{
                let reactions = []
                let client_link = this.client;
                for(let i = 0; i < locations.length; i++){
                    msg_bot.react(extra.getReactFromInt(i)).then(reaction=>{
                        reactions.push(reaction)
                        this.awaitReaction(
                            msg_bot,
                            msg.author,
                            extra.getReactFromInt(i),
                            ()=>{

                                reaction.remove(msg.author)
                                reactions.forEach(r=>{
                                    r.remove(client_link.user)
                                })
                                msg_bot.edit(
                                    new Discord.MessageEmbed()
                                    .setAuthor("Смена локации")
                                    .setDescription("Это может занять некоторое время...")
                                )
                                player.transit(
                                    locations[i].id,
                                    ()=>{
                                        msg_bot.edit(
                                            new Discord.MessageEmbed()
                                            .setColor("#2f3136")
                                            .setAuthor("ПДА: Местоположение",this.client.user.avatarURL())
                                            .setDescription(`**${player.location.location.name}**\n   *${player.location.sublocation.name}*`)
                                        )
                                    }
                                )

                            }
                        )
                    })
                }
            });            
        },
        "люди":(msg)=>{
            if(!usersManager.checkRegUser(msg.author.id)){
                this.fastlogin(msg)
                return
            }

            let player = usersManager.getPlayerFromId(msg.author.id);
            let loc = player.location.location
            let subloc = player.location.sublocation;

            let entitys = player.location.sublocation.entitys;

            let str = [];
            entitys.map((c,i)=>{
                str[i] = `${i}. \`${c.name}\``
            })
            if(entitys.length == 0){
                str[0] = "`Похоже здесь людей нет...`"
            }

            let embed = new Discord.MessageEmbed();
            embed
                .setColor("#2f3136")
                .setAuthor("ПДА: Люди",this.client.user.avatarURL())
                .setDescription(`**${loc.name}**\n   *${subloc.name}*`)
                .addField("Люди:",str.join("\n"))
                .addField("Примечание","Взаемодействие доступно только для NPC\nторговцев и квестовых персонажей\n \nДля игроков выводится информация о них")
                .setFooter("Нажми на номер нужного человека")
            
            msg.channel.send(embed).then(msg_bot=>{
                let reactions = []
                let client_link = this.client;

                for(let i = 0; i < entitys.length; i++){
                    msg_bot.react(extra.getReactFromInt(i)).then(reaction=>{
                        let npc = entitys[i]
                        reactions.push(reaction)

                        this.awaitReaction(
                            msg_bot,
                            msg.author,
                            extra.getReactFromInt(i),
                            ()=>{
                                reaction.remove(msg.author)
                                reactions.forEach(r=>{
                                    r.remove(client_link.user)
                                })

                                if(subloc.entityIsTrader(entitys[i].id)){

                                    let str_items = []
                                    npc.trade_list.map((c,i)=>{
                                        console.log(c)
                                        let item = itemManager.findById(c.id)
                                        str_items[i] = `${i}. \`${item.name}\` *${c.info.cost}RU*`
                                    })

                                    let embed_trade = new Discord.MessageEmbed();
                                    embed_trade
                                        .setColor("#2f3136")
                                        .setAuthor(`${npc.name}: Предметы в продаже`,npc.icon)
                                        .setDescription(`**${loc.name}**\n   *${subloc.name}*`)
                                        .addField("Предметы:",str_items.join("\n"))

                                    msg.channel.send(embed_trade)
                                }else {
                                    let embed_entity = new Discord.MessageEmbed();
                                    embed_entity
                                        .setColor("#2f3136")
                                        .setAuthor(npc.name,npc.icon)
                                        .setDescription(`${npc.desc}`)

                                    msg.channel.send(embed_entity)
                                }
                            }
                        )
                    })
                }
            })
        },
        "реакция":(msg)=>{

            msg.channel.send("Сообщение").then(message=>{
                message.react(this.client.emojis.cache.get("668923953515069440")).then(my_react=>{
                    
                    this.awaitReaction(
                        message,
                        msg.author,
                        "<:monowut:668923953515069440>",
                        ()=>{
                            my_react.remove(this.client.user);
                            msg.reply("<:monowut:668923953515069440>");
                        }
                    )
                })

            })
        },
        "бот":(msg)=>{
            this.client.fetchApplication().then(app=>{
                let owner = app.owner;

                msg.channel.send(
                    new Discord.MessageEmbed()
                    .setColor("#2f3136")
                    .setAuthor("S.T.A.L.K.E.R RP",this.client.user.avatarURL())
                    .addField("Автор",`*\`${owner.tag}\`*`)
                    .setThumbnail(owner.avatarURL())
                    .addField("Сыллки",
                        `[\`[Пригласить бота]\`](https://discord.com/api/oauth2/authorize?client_id=683258927311618101&permissions=117824&scope=bot)\n`+
                        `[\`[GitHub]\`](https://github.com/VVSnitka/Stalker-Bot)`
                    )
                )
            })
        }

    }
    constructor(client){
        this.client = client;
    }

    findAndRun(cmd_name,msg){
        if(this.commands[cmd_name] !== undefined){
            this.commands[cmd_name](msg);
        }
    }
    awaitReaction (message,usr,react,callback) {
        function tick (cmd_manager){
            const filter = (reaction, user) => {
                return reaction.emoji.toString() === react && user.id === usr.id &&user.id !== cmd_manager.client.user.id
            }
            message.awaitReactions(filter, { time:100 })
                .then(collected => {
                    if(collected.size > 0){
                        callback();
                        clearInterval(this);
                    }
                })
                .catch(console.error);
        }
        setInterval(tick,100,this)
    }
}
module.exports = CommandManager