/**
 * Скрипт позволяет тестировать Restful API приложения
 */
"use strict";

let prefix = '/api';
let box = testBox;

// run
$(x => {
	box.innerHTML = '';
	new registerScenario('test' + Date.now(), '12341234');
});

/**
 * Scenario 1
 * Проверка авторизации и выхода
 */
let registerScenario = function (username, password, cb) {
	/* Объект будет хранить состояние */
	this.credentials = {};

	/* Когда получен токен, его надо сохранить */
	this.setToken = function (isFail, res) {
		if (isFail)
			throw new Error('Метод должен вернуть токен!');

		let token = res.token;
		if (!token || !token.trim()) {
			throw new Error('Метод должен вернуть токен!');
		}
		this.credentials.token = token;
	};

	/* Нужен для проверки результата */
	this.checkExit = function (isFail) {
		return true;
	};

	let email = username + '@mail.ru';

	/* Создаю и запускаю сценарий */
	new scenarior(box, 'Проверка регистрации пользователя', true, cb)
		.add(METH.accountRegister.bind(this, username, password, email), `Регистрация пользователя ${username}`)
		.add(METH.accountEnter.bind(this, username, password), `Авторизация пользователя ${username}`, this.setToken.bind(this))
		.add(METH.accountExit.bind(this, this.credentials), 'Выход')
		.add(METH.accountExit.bind(this, this.credentials), 'Повторный выход', this.checkExit.bind(this))
		.start();
};

/**
 * Методы для тестирования
 */
let METH = {
	errorHandler(xhr) {
		console.error('Error #%s%s',
			xhr.status,
			xhr.responseJSON ? ': ' + xhr.responseJSON.message : '',
			xhr.responseJSON || xhr.responseText,
			xhr);
	},

	ajax(url, method, jsonObject, success, fail) {
		$.ajax(url, {
			contentType: 'application/json; charset=utf-8',
			method: method,
			data: JSON.stringify(jsonObject),
			dataType: 'json'
		})
			.done(success)
			.fail(fail || METH.errorHandler);
	},

	accountRegister(username, password, email, success, fail) {
		let obj = {username, password, email};
		METH.ajax(prefix + '/account/register', 'PUT', obj, success, fail);
	},

	accountEnter(username, password, success, fail) {
		let obj = {username, password};
		METH.ajax(prefix + '/account/login', 'POST', obj, success, fail);
	},

	accountExit({token}, success, fail) {
		let obj = {token};
		METH.ajax(prefix + '/account/logout', 'POST', obj, success, fail);
	},
};