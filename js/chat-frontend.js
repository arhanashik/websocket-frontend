$(function() {
    "use strict"

    var content = $('#content')
    var input = $('#input')
    var status = $('#status')
	
	var emailEt = $('#email')
    var passwordEt = $('#password')
	var loginBtn = $('#login')

    var myColor = false
    var myName = false
	var mySessionId = false

    window.WebSocket = window.WebSocket || window.MozWebSocket

    if(!window.WebSocket) {
        content.html($('<p>',
            { text: 'Sorry, your browser doen\'t support WebSocket'}
        ))

        input.hide()
        $('span').hide()
        return
    }

    var connection = new WebSocket('ws://192.168.2.28:1337')

    connection.onopen = function() {
        input.removeAttr('disabled')
        emailEt.removeAttr('disabled')
        passwordEt.removeAttr('disabled')
        loginBtn.removeAttr('disabled')
        status.text('Choose name: ')
    }

    connection.onerror = function(error) {
        console.log(error)
        content.html($('<p>',
            { text: 'Sorry, there\'s some problem with your connection or the server is down'}
        ))
    }

    connection.onmessage = function(message) {

        try {
            var json = JSON.parse(message.data)
        } catch (e) {
            console.log('This doesn\'t look like a vaid JSON: ', message.data)
            return
        }

        switch(json.type) {
			case 'welcome':
				mySessionId = json.data.session_id
                break
				
            case 'color':
                myColor = json.data
                status.text(myName + ': ').css('color', myColor)
                input.removeAttr('disabled').focus()
                break
            
            case 'history':
				var history = json.data
				console.log(json.data)
                for (var i = 0; i < history.length; i++) {
                    addMessage(history[i].name, history[i].message,
                        'green', new Date(history[i].time))
                }
                break

            case 'message':
				alert('new message')
                input.removeAttr('disabled')
                addMessage(json.data.author, json.data.text,
                    json.data.color, new Date(json.data.time))
                break
				
			case 'error':
				alert(json.data.error)
                break

            default:
                console.log('Hmm... I\'ve never seen JSON like this:', json)
                break
        }
    }

    input.keydown(function(e) {
        if(e.keyCode === 13) {
            var msg = $(this).val()
            if(!msg) return

			var obj = {
				session_id: mySessionId,
				type: 'broadcast',
				message: msg
			}
            connection.send(JSON.stringify(obj))
            console.log('sent to websocket: ' + JSON.stringify(obj))
            $(this).val('')

            input.attr('disabled', 'disabled')

            if(myName === false) {
                myName = msg
            }
        }
    })
	
	loginBtn.on('click', () => {
		var email = emailEt.val()
		var password = passwordEt.val()
		
		var obj = {
			session_id: mySessionId,
			type: 'authenticate',
			email: email,
			password: password
		}
		
		console.log('sent to websocket: ' + JSON.stringify(obj))
		connection.send(JSON.stringify(obj))
	})

    setInterval(function() {
        if(connection.readyState !== 1) {
            status.text('Error')
            input.attr('disabled', 'disabled').val(
                'Unable to communicate with the WebSocket server'
            )
        }
    }, 3000)

    function addMessage(author, message, color, dt) {
        // content.prepend('<p><span style="color:' + color + '">'
        //     + author + '</span> @ ' + (dt.getHours() < 10 ? '0'
        //     + dt.getHours() : dt.getHours()) + ':'
        //     + (dt.getMinutes() < 10? '0' + dt.getMinutes() : dt.getMinutes())
        //     + ': ' + message + '</p>')
        content.append('<p><span style="color:' + color + '">'
            + author + '</span> @ ' + (dt.getHours() < 10 ? '0'
            + dt.getHours() : dt.getHours()) + ':'
            + (dt.getMinutes() < 10? '0' + dt.getMinutes() : dt.getMinutes())
            + ': ' + message + '</p>')
    }
})