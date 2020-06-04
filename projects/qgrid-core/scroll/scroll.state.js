import { identity } from '../utility/kit';

export class ScrollState {
	constructor() {
		this.mode = 'default';

		this.top = 0;
		this.left = 0;		
		this.cursor = 0;

		this.map = {
			rowToView: identity,
			viewToRow: identity
		};

		this.resetTriggers = [
			'sort.view',
			'sort.toggle.command',
			'column.filter.view',
			'data.manipulation'
		];
	}
}