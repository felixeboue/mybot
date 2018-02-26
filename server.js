const {Client}  = require('discord.js');
const yt = require('ytdl-core');
const adminID = "415415442580963329";
const d_token = "NDE1OTYzNjkxOTEwMTY4NTgw.DXVhgg.CcU2dYJQyo-ChsIgPmSE4eFKWl0";
const prefix = "!";
const passes = 1;
const client = new Client();
const mysql = require('mysql');


let queue = {};





const commands = {
	'play': (msg) => {
		if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Ajoute des sons dans la queue avec ${prefix}add`);
		if (!msg.guild.voiceConnection) return commands.join(msg).then(() => commands.play(msg));
		if (queue[msg.guild.id].playing) return msg.channel.sendMessage('Déja en train de jouer');
		let dispatcher;
		queue[msg.guild.id].playing = true;

		console.log(queue);
		(function play(song) {
			console.log(song);
			if (song === undefined) return msg.channel.sendMessage('La queue est vide').then(() => {
				queue[msg.guild.id].playing = false;
				msg.member.voiceChannel.leave();
			});
			msg.channel.sendMessage(`Joue: **${song.title}** ajouté par: **${song.requester}**`);
			dispatcher = msg.guild.voiceConnection.playStream(yt(song.url, { audioonly: true }), { passes : passes });
			let collector = msg.channel.createCollector(m => m);
			collector.on('message', m => {
				if (m.content.startsWith(prefix + 'pause')) {
					msg.channel.sendMessage('pause').then(() => {dispatcher.pause();});
				} else if (m.content.startsWith(prefix + 'resume')){
					msg.channel.sendMessage('reprend').then(() => {dispatcher.resume();});
				} else if (m.content.startsWith(prefix + 'skip')){
					msg.channel.sendMessage('passé').then(() => {dispatcher.end();});
				} else if (m.content.startsWith('volume+')){
					if (Math.round(dispatcher.volume*50) >= 100) return msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
					dispatcher.setVolume(Math.min((dispatcher.volume*50 + (2*(m.content.split('+').length-1)))/50,2));
					msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
				} else if (m.content.startsWith('volume-')){
					if (Math.round(dispatcher.volume*50) <= 0) return msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
					dispatcher.setVolume(Math.max((dispatcher.volume*50 - (2*(m.content.split('-').length-1)))/50,0));
					msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
				} else if (m.content.startsWith(prefix + 'time')){
					msg.channel.sendMessage(`time: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000)/1000) <10 ? '0'+Math.floor((dispatcher.time % 60000)/1000) : Math.floor((dispatcher.time % 60000)/1000)}`);
				}
			});
			dispatcher.on('end', () => {
				collector.stop();
				play(queue[msg.guild.id].songs.shift());
			});
			dispatcher.on('error', (err) => {
				return msg.channel.sendMessage('error: ' + err).then(() => {
					collector.stop();
					play(queue[msg.guild.id].songs.shift());
				});
			});
		})(queue[msg.guild.id].songs.shift());
	},

	
	
	'join': (msg) => {
		return new Promise((resolve, reject) => {
			const voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('Je ne peux pas rejoindre ce channel');
			voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
		});
	},
	'marie':(msg)=>{
		msg.channel.sendMessage("Une véritable chienne, tous mes amis les bot l'a déboite");
	},
	
	'add': (msg) => {
		let url = msg.content.split(' ')[1];
		if (url == '' || url === undefined) return msg.channel.sendMessage(`Ajoute un lien youtube après le : ${prefix}add`);
		yt.getInfo(url, (err, info) => {
			if(err) return msg.channel.sendMessage('Lien Youtube invalide ' + err);
			if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
			queue[msg.guild.id].songs.push({url: url, title: info.title, requester: msg.author.username});
			msg.channel.sendMessage(`Ajouté **${info.title}** a la queue`);
		});
	},

	'kick':(msg)=>{
		if(!msg.channel.permissionsFor(msg.member).hasPermission("KICK_MEMBERS")){
			msg.reply("T'as cru que t'avais le droit de kick ? xd");
		}else{
			var memberkick = msg.mentions.users.first();
			if(!memberkick){
				msg.reply("L'utilisateur n'existe pas");
			}else {
				if(!msg.guild.member(memberkick).kickable){
					msg.reply("Utilisateur impossible a kick");
				}else{
					msg.guild.member(memberkick).kick().then((member)=>{
					msg.channel.send(member.displayName+" à été kick, cheh");
					});
					
				}
		 
			}
	 
		}	},
		'ban':(msg)=>{
			if(!msg.channel.permissionsFor(msg.member).hasPermission("BAN_MEMBERS")){
				msg.reply("T'as cru que t'avais le droit de ban ? xd");
			}else{
				var memberban = msg.mentions.users.first();
				if(!memberban){
					msg.reply("L'utilisateur n'existe pas");
				}else {
					if(!msg.guild.member(memberban).bannable){
						msg.reply("Utilisateur impossible a ban");
					}else{
						msg.guild.member(memberban).ban().then((member)=>{
						msg.channel.send(member.displayName+" à été ban, cheh");
						});
						
					}
			 
				}
		 
			}	},
	
	'queue': (msg) => {
		if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Ajoute d'abord un son a la queue avec : ${prefix}add`);
		let tosend = [];
		queue[msg.guild.id].songs.forEach((song, i) => { tosend.push(`${i+1}. ${song.title} - Demandé par : ${song.requester}`);});
		msg.channel.sendMessage(`__**${msg.guild.name}'s Music Queue:**__ Currently **${tosend.length}** songs queued ${(tosend.length > 15 ? '*[Jusqu a 15 sons !]*' : '')}\n\`\`\`${tosend.slice(0,15).join('\n')}\`\`\``);
	},
	'help': (msg) => {
		let tosend = ['```xl', prefix + 'join : "Le bot rejoint le salon actuel"',prefix +'xp +@utilisateur : "Affiche les xp de l utilisateur"',prefix +'level +@utilisateur : "Affiche le level de l utilisateur"', prefix + 'add : "Ajoute un lien Youtube valide a la queue  8=====D"', prefix + 'queue : "Montre la queue actuelle ( pas la mienne ), jusqu à 15 sons."', prefix + 'play : "Joue le son dans la queue, si le bot est dans le salon"', '', 'les commandes suivantes ne fonctionnent que lorsque la commande de lecture est en cours d éxécution:'.toUpperCase(), prefix + 'pause : "Met la musique en pause"',	prefix + 'resume : "Reprend la musique"', prefix+ 'kick + @Utilisateur : "Kick un utilisateur"', prefix + 'skip : "Passe le son"', prefix + 'time : "Monter le timer du son."',	'volume+(+++) : "Augmente le volume de 2%/+"',	'volume-(---) : "Baisse le volume de 2%/-"',	'```'];
		msg.channel.sendMessage(tosend.join('\n'));
	},
	'reboot': (msg) => {
		if (msg.author.id == adminID) process.exit(); //Requires a node module like Forever to work.
	}
};

client.on('ready', () => {
	console.log('ready!');
});


var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "1234",
	database: "sabd",
});

con.connect(err =>{
	if(err)throw err;
	console.log("Connected to database");  
});

function generateXp() {
	let min =20;
	let max = 30;
	return Math.floor(Math.random() * (max - min +1)) +min;
}


client.on('message', message => {

	
		con.query(`SELECT * FROM xp WHERE id = '${message.author.id}'`, (err, rows)=>{
	
			if(err) throw err;
			

			let sql;

			if(rows.length<1){
				sql = `INSERT INTO xp (id, xp) VALUES('${message.author.id}', ${generateXp()})`;
			}
			else{
				let xp = rows[0].xp;
				sql = `UPDATE xp SET xp = ${generateXp()+xp} WHERE id = '${message.author.id}'`;
				}


				let messageArray =message.content.split(/\s+/g);
				let command = messageArray[0];
				let args = messageArray.slice(1);
				let target = message.mentions.users.first() || message.guild.members.get(args[1]) || message.author;

				if(message.content.startsWith("!xp")){
		

	con.query(`SELECT * FROM xp WHERE id = '${target.id}'`, (err, rows)=>{
		if(err)throw err;
		if(!rows[0]) return message.channel.send("Cet utilisateur n'a pas encore d'xp");
		let xp = rows[0].xp;
		
		message.channel.send(target.username + " possède " +xp + " xp");
	});	



				}



				if(message.content.startsWith("!level")){
		

					con.query(`SELECT * FROM xp WHERE id = '${target.id}'`, (err, rows)=>{
						if(err)throw err;
						if(!rows[0]) return message.channel.send("Cet utilisateur n'a pas encore de level");
						let xp = rows[0].xp;
						if(xp>=500&& xp<999){
									
							message.channel.send("Bravo tu as dépassé les 500 xp tu es maintenant level2");
						
						}

						if(xp>=1000&& xp <1999){
									
							message.channel.send("Bravo tu as dépassé les 1000 xp tu es maintenant level3");
						
						}

						if(xp>=2000&&xp<4999){
									
							message.channel.send("Bravo tu as dépassé les 2000 xp tu es maintenant level4");
						
						}

						if(xp>=5000&& xp<9999){
									
							message.channel.send("Bravo tu as dépassé les 5000 xp tu es maintenant level5");
						
						}

						if(xp>=10000){
									
							message.channel.send("Bravo tu as dépassé les 10000 xp tu es maintenant level6");
						
						}
						
					});	
				
				
				
								}
				
			

			con.query(sql);
		});
		

	const blacklisted = ["ntm", "pd","fdp", "pute", "putes", "connard", "enculé", "bite"];
	for(var i in blacklisted) {
	if(message == blacklisted[i]){
		
		message.delete();
		return	message.channel.sendMessage(message.author+' Fais attention comment tu parles!')	;
	}
}
		
	const blacklistedd = ["aglae", "Aglae","aglaé", "Aglaé"];
	for(var i in blacklistedd) {
	if(message == blacklistedd[i]){
		
		message.delete();
		return	message.channel.sendMessage(message.author+' Parles pas mal de la soeur de mon créateur fdp')	;
		if (message.author.bot) return;
	}

	if(message.content.startsWith("ag"||" ag"||"  ag"||"   ag"||"     ag"||"      ag"||"         ag"||"                    ag")){
		return	message.channel.sendMessage(message.author+' Parles pas mal de la soeur de mon créateur fdp')	;
		if (message.author.bot) return;
	}
	
}	

		
});





client.on('message', msg => {
	if (!msg.content.startsWith(prefix)) return;
	if (commands.hasOwnProperty(msg.content.toLowerCase().slice(prefix.length).split(' ')[0])) commands[msg.content.toLowerCase().slice(prefix.length).split(' ')[0]](msg);
});
client.login("NDE1OTYzNjkxOTEwMTY4NTgw.DXVhgg.CcU2dYJQyo-ChsIgPmSE4eFKWl0");
