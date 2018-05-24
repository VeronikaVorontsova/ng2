import { PluginView } from '../plugin.view';
import { Event } from '../../core/infrastructure/event';

export declare class BackdropView extends PluginView {
	constructor(context: { element: HTMLElement, propagate: boolean, onKeyDown: (e: any) => void });

	closeEvent: Event;
}
