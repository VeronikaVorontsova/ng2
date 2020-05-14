import { Log } from '../infrastructure/log';
import * as css from '../services/css';
import * as columnService from '../column/column.service';
import { Fastdom } from '../services/fastdom';
export class LayoutLet {
	constructor(plugin, gridService) {
		const { model, observeReply, disposable } = plugin;
		const styleRow = this.styleRow.bind(this);

		this.plugin = plugin;
		this.service = gridService;

		observeReply(model.navigationChanged)
			.subscribe(e => {
				if (e.hasChanges('cell')) {
					const oldColumn = e.changes.cell.oldValue ? e.changes.cell.oldValue.column : {};
					const newColumn = e.changes.cell.newValue ? e.changes.cell.newValue.column : {};

					if (oldColumn.key !== newColumn.key && (oldColumn.viewWidth || newColumn.viewWidth)) {
						Fastdom.measure(() => {
							const form = this.updateColumnForm();
							Fastdom.mutate(() => this.invalidateColumns(form));
						});
					}
				}
			});

		observeReply(model.layoutChanged)
			.subscribe(e => {
				if (e.tag.source === 'layout.view') {
					return;
				}

				if (e.hasChanges('columns')) {
					Fastdom.measure(() => {
						const form = this.updateColumnForm();
						Fastdom.mutate(() => this.invalidateColumns(form));
					});
				}
			});

		observeReply(model.rowChanged)
			.subscribe(e => {
				if (e.hasChanges('canResize')) {
					const rows = Array.from(model.style().rows);
					if (e.state.canResize) {
						rows.push(styleRow);
					}
					else {
						const index = model.style.rows.indexOf(styleRow);
						rows.splice(index, 1);
					}
					model.style({ rows }, { source: 'layout.view' });
				}
			});

		observeReply(model.dataChanged)
			.subscribe(e => {
				if (e.hasChanges('columns')) {
					model.layout({
						columns: new Map()
					}, {
						source: 'layout.view',
						behavior: 'core'
					});
				}
			});

		disposable.add(() => {
			const sheet = css.sheet(this.gridId, 'column-layout');
			sheet.remove();
		});
	}

	updateColumnForm() {
		const { model, table } = this.plugin;
		const { head } = table;
		const { cells } = head.context.bag;
		const layout = model.layout().columns;

		const form = new Map();
		for (let cell of cells) {
			const { column, rowIndex, columnIndex } = cell;
			if (!column.canResize) {
				continue;
			}

			const { key } = column;
			if (layout.has(key)) {
				const { width } = layout.get(key);
				form.set(key, { width });
			} else {
				const th = head.cell(rowIndex, columnIndex);
				const width = th.width();

				// It can be that clientWidth is zero on start, while css is not applied.
				if (width) {
					form.set(key, { width });
				}
			}
		}

		model.layout({ columns: form }, { source: 'layout.view', behavior: 'core' });

		const { column } = model.navigation();
		if (column && column.viewWidth) {
			const viewForm = new Map(form)
			const columnForm = form.get(column.key);
			viewForm.set(column.key, { width: columnForm ? Math.max(columnForm.width, column.viewWidth) : column.viewWidth });
			return viewForm;
		}

		return form;
	}

	invalidateColumns(form) {
		Log.info('layout', 'invalidate columns');

		const { table } = this.plugin;
		const columns = table.data.columns();
		const getWidth = columnService.widthFactory(table, form);

		const style = {};
		let { length } = columns;

		while (length--) {
			const column = columns[length];
			const width = getWidth(column.key);
			if (null !== width) {
				const key = css.escape(column.key);
				const size = width + 'px';
				const sizeStyle = {
					'width': size,
					'min-width': size,
					'max-width': size
				};

				style[`td.q-grid-the-${key}`] = sizeStyle;
				style[`th.q-grid-the-${key}`] = sizeStyle;
			}
		}

		const sheet = css.sheet(this.gridId, 'column-layout');
		sheet.set(style);
	}

	styleRow(row, context) {
		const { model } = this.plugin;
		const { layout } = model;

		const form = layout().rows;
		const style = form.get(row);
		if (style) {
			context.class(`resized-${style.height}px`, { height: style.height + 'px' });
		}
	}

	get gridId() {
		return this.plugin.model.grid().id;
	}
}