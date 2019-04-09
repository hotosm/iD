import { t } from '../util/locale';
import { behaviorOperation } from '../behavior';
import { geoExtent } from '../geo';
import { modeRotate } from '../modes';
import { utilGetAllNodes } from '../util';


export function operationRotate(selectedIDs, context) {
    var multi = (selectedIDs.length === 1 ? 'single' : 'multiple');
    var nodes = utilGetAllNodes(selectedIDs, context.graph());
    var coords = nodes.map(function(n) { return n.loc; });
    var extent = nodes.reduce(function(extent, node) {
        return extent.extend(node.extent(context.graph()));
    }, geoExtent());


    var operation = function() {
        context.enter(modeRotate(context, selectedIDs));
    };


    operation.available = function() {
        return nodes.size >= 2;
    };


    operation.disabled = function() {
        var osm = context.connection();
        if (extent.area() && extent.percentContainedIn(context.extent()) < 0.8) {
            return 'too_large';
        } else if (osm && !coords.every(osm.isDataLoaded)) {
            return 'not_downloaded';
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        } else if (selectedIDs.some(incompleteRelation)) {
            return 'incomplete_relation';
        }
        return false;

        function incompleteRelation(id) {
            var entity = context.entity(id);
            return entity.type === 'relation' && !entity.isComplete(context.graph());
        }
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.rotate.' + disable + '.' + multi) :
            t('operations.rotate.description.' + multi);
    };


    operation.annotation = function() {
        return selectedIDs.length === 1 ?
            t('operations.rotate.annotation.' + context.geometry(selectedIDs[0])) :
            t('operations.rotate.annotation.multiple');
    };


    operation.id = 'rotate';
    operation.keys = [t('operations.rotate.key')];
    operation.title = t('operations.rotate.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
