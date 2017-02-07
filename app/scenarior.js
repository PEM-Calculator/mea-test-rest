/**
 * Created by makarov on 03.02.17.
 * Скрипт тестирования сценариев.
 */
"use strict";

/**
 * Main Test Decorator
 * @param scenarioName  Название теста
 * @param logging       Должен ли тест выводить логи
 * @param cb            Метод, который будет вызван по завршению теста
 * @returns {createTask}
 */
let scenarior = function (_logbox, _scenarioName, _logging = true, cb = null) {
	this.logbox = _logbox;
	this.scenarioName = ('Сценарий ' + (_scenarioName ? '`' + _scenarioName + '`' : '')).trim();
	this.logging = _logging;
	this.callback = cb;
	this.loading = $('<div>Ждите <span class="loading"></span></div>')
		.appendTo(this.logbox)
		.hide();

	/* Стек методов */
	this.stack = [];

	/* Время начала теста */
	this.startDate = 0;

	this.print = function (msg, cls = '', ...args) {
		$('<div/>')
			.html(msg)
			.addClass('logline ' + (cls || null))
			.insertBefore(this.loading);

		if (this.logging) {
			let m = (cls == 'fail') ? console.error : console.info;
			if (args.length)
				m.call(console, msg, args);
			else
				m.call(console, msg);
		}
	};

	/**
	 * Метод добавляет один шаг в стек выполнения
	 * @param method    Метод выполнения
	 * @param stepTitle Название шага
	 * @param cb        Callback
	 * @returns {createTask}
	 */
	this.add = function (_method, _stepTitle = null, cb = null) {
		this.stack.push({
			index: this.stack.length + 1,
			method: _method,
			title: _stepTitle,
			callback: cb
		});
		return this;
	};

	/**
	 * Выполняет запуск теста
	 */
	this.start = function () {
		this.loading.show();

		this.print(`${this.scenarioName} запущен (шагов: ${this.stack.length})`);

		this.startDate = +Date.now();
		this.nextStep();
	};

	/**
	 * Запуск следующего шага
	 */
	this.nextStep = function () {
		if (this.stack.length > 0) {
			let stackItem = this.stack.shift();
			let doneHandler = this.finishHandler(stackItem);
			stackItem.method(
				// success callback
				doneHandler.bind(this, false),
				// fail callback
				doneHandler.bind(this, true)
			);
		}
		else {
			this.finish();
		}
	};

	/**
	 * Декоратор - хук на удачно завершенный тест
	 * @param methObj
	 * @returns {Function}
	 */
	this.finishHandler = function (methObj) {
		let title = (methObj.index + ') ' + (methObj.title ? '`' + methObj.title + '`' : "")).trim();
		// this.print(`Шаг ${title} запущен`, 'info');
		let startDate = +Date.now();

		return function (isFail, ...args) {
			let length = +Date.now() - startDate;
			let sayResult = false;

			try {
				if (methObj.callback) {
					// если метод захочет, продолжим выполнение
					sayResult = methObj.callback.call(this, isFail, ...args);
				}

				// возможно, случилась ошибка при выполнении шага
				// но метод проверки выше мог сказать, что все ок
				// проверим это
				if (isFail && !sayResult) {
					// все говорит о том, что шаг завершился неудачей
					this.print(`Шаг ${title} завершился с ошибкой<i class="time">${length} мс</i>`, 'fail', args);
					this.finish(true);
					return;
				}

				this.print(`Шаг ${title} завершился удачно<i class="time">${length} мс</i>`, 'success', args);
				this.nextStep();
			}
			catch (ex) {
				this.print(`Во время выполнения теста вызвано исключение:<blockquote>${ex}</blockquote>`, 'fail', ex);
				this.finish(true);
			}
		}
	};

	/**
	 * Метод вызывается когда стек выполнения заканчивается
	 * Либо выполнение сценария завершилось с ошибкой
	 */
	this.finish = function (isFail = false) {
		let length = +Date.now() - this.startDate;

		if (isFail) {
			this.print(`${this.scenarioName} завершился с ошибкой<i class="time">${length} мс</i>`, 'fail');
		}
		else {
			this.print(`${this.scenarioName} завершился удачно<i class="time">${length} мс</i>`, 'success');
		}

		this.loading.hide();

		if (this.callback) {
			this.callback();
		}
	};

	return this;
};