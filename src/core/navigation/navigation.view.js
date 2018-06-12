import { Command } from '../command/command';
import { Navigation } from './navigation';
import { GRID_PREFIX } from '../definition';
import { Td } from '../dom/td';
import { Fastdom } from '../services/fastdom';
import { FocusAfterRender } from '../focus/focus.service';

export class NavigationView {
	constructor(model, table, shortcut) {
		this.model = model;
		this.table = table;

		const navigation = new Navigation(model, table);
		let focusBlurs = [];

		shortcut.register(navigation.commands);

		this.focus = new Command({
			source: 'navigation.view',
			execute: e => {
				const { rowIndex, columnIndex, behavior } = e;
				const td = table.body.cell(rowIndex, columnIndex).model();
				if (td) {
					const { row, column } = td;
					model.navigation({
						cell: {
							rowIndex,
							columnIndex,
							row,
							column
						}
					}, {
							source: 'navigation.view',
							behavior
						});
				} else {
					model.navigation({
						cell: null
					}, {
							source: 'navigation.view',
							behavior
						});
				}
			},
			canExecute: newCell => {
				const oldCell = model.navigation().cell;
				if (newCell && newCell.column.canFocus && !Td.equals(newCell, oldCell)) {
					if (this.model.edit().mode !== 'cell') {
						switch (this.model.selection().unit) {
							case 'row':
							case 'column': {
								// Focus cell only if it was focused previously by keyboard
								if (!oldCell) {
									return false;
								}
								break;
							}
						}
					}

					return true;
				}

				return false;
			}
		});

		this.scrollTo = new Command({
			source: 'navigation.view',
			execute: (row, column) => {
				const cell = table.body.cell(row, column);
				this.scroll(table.view, cell);
			},
			canExecute: (row, column) => table.body.cell(row, column).model() !== null
		});

		model.navigationChanged.watch(e => {
			if (e.hasChanges('cell')) {
				if (e.tag.behavior !== 'core') {
					// We need this one to toggle focus from details to main grid
					// or when user change navigation cell through the model
					if (!this.table.view.isFocused()) {
						this.table.view.focus();
					}
				}

				const { rowIndex, columnIndex } = e.state;
				focusBlurs = this.invalidateFocus(focusBlurs);
				if (e.tag.source !== 'navigation.scroll' && this.scrollTo.canExecute(rowIndex, columnIndex)) {
					this.scrollTo.execute(rowIndex, columnIndex);
				}

				model.focus({
					rowIndex,
					columnIndex
				}, {
						source: 'navigation.view'
					});
			}
		});

		model.focusChanged.watch(e => {
			if (e.tag.source === 'navigation.view') {
				return;
			}

			if (e.hasChanges('rowIndex') || e.hasChanges('columnIndex')) {
				this.focus.execute(e.state);
			}
		});

		let startRow = null;
		let startColumn = null;
		model.sceneChanged.watch(e => {
			if (e.hasChanges('status')) {
				const { status } = e.state;
				switch (status) {
					case 'start': {
						startRow = model.navigation().row;
						startColumn = model.navigation().column;
						break;
					}
					case 'stop':
						if (startRow && startColumn) {
							const rowIndex = table.data.rows().indexOf(startRow);
							const columnIndex = table.data.columns().findIndex(column => column.key === startColumn.key);

							startRow = null;
							startColumn = null;

							this.focus.execute({
								rowIndex,
								columnIndex,
								behavior: 'core'
							});
						}
						break;
				}
			}
		});
	}

	invalidateFocus(dispose) {
		dispose.forEach(f => f());
		dispose = [];

		const { rowIndex, columnIndex } = this.model.navigation();
		const cell = this.table.body.cell(rowIndex, columnIndex);
		if (cell.model()) {
			Fastdom.mutate(() => cell.addClass(`${GRID_PREFIX}-focused`));
			dispose.push(() => Fastdom.mutate(() => cell.removeClass(`${GRID_PREFIX}-focused`)));
		}

		return dispose;
	}

	scroll(view, target) {
		Fastdom.measure(() => {
			const tr = target.rect();
			const vr = view.rect();
			const oldScrollState = this.model.scroll();
			const newScrollState = {};

			if (view.canScrollTo(target, 'left')) {
				if (vr.left > tr.left
					|| vr.left > tr.right
					|| vr.right < tr.left
					|| vr.right < tr.right) {

					if (vr.width < tr.width || vr.left > tr.left || vr.left > tr.right) {
						newScrollState.left = tr.left - vr.left + oldScrollState.left;
					}
					else if (vr.left < tr.left || vr.right < tr.right) {
						newScrollState.left = tr.right - vr.right + oldScrollState.left;
					}
				}
			}

			if (view.canScrollTo(target, 'top')) {
				if (vr.top > tr.top
					|| vr.top > tr.bottom
					|| vr.bottom < tr.top
					|| vr.bottom < tr.bottom) {

					if (vr.height < tr.height || vr.top > tr.top || vr.top > tr.bottom) {
						newScrollState.top = tr.top - vr.top + oldScrollState.top;
					}
					else if (vr.top < tr.top || vr.bottom < tr.bottom) {
						newScrollState.top = tr.bottom - vr.bottom + oldScrollState.top;
					}
				}
			}

			if (Object.keys(newScrollState).length) {
				this.model.scroll(newScrollState, { bevavior: 'core', source: 'navigation.view' });
			}
		});
	}
}