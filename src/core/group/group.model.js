import { Resource } from '../resource/resource';
import { Command } from '../command/command';
import { flatView } from '../node/node.service';

export class GroupModel {
	constructor() {
		this.resource = new Resource();
		this.mode = 'nest'; // nest | flat | subhead | rowspan
		this.by = [];
		this.shortcut = {
			toggle: 'space'
		};
		this.toggle = new Command({ source: 'group.model' });
		this.toggleAll = new Command({ source: 'group.model' });

		this.flatten = flatView;
	}
}