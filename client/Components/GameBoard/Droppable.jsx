import React from 'react';
import { useDrop } from 'react-dnd';
import classNames from 'classnames';

import { ItemTypes } from '../../constants';

import './Droppable.scss';

const validTargets = {
    hand: ['play area', 'discard', 'deck', 'archives', 'purged'],
    'play area': ['discard', 'hand', 'deck', 'archives', 'purged'],
    discard: ['archives', 'hand', 'deck', 'play area', 'purged'],
    archives: ['hand', 'deck', 'play area', 'discard', 'purged'],
    deck: ['hand', 'discard', 'archives', 'play area', 'purged'],
    purged: ['deck', 'play area', 'discard', 'hand', 'archives']
};

const Droppable = ({ children, manualMode, onDragDrop, source }) => {
    const [{ canDrop, isOver, itemSource }, drop] = useDrop({
        accept: ItemTypes.CARD,
        canDrop: (_, monitor) => {
            let item = monitor.getItem();

            if (manualMode) {
                return (
                    validTargets[item.source] &&
                    validTargets[item.source].some((target) => target === source)
                );
            }

            if (
                (item.source === 'hand' && source === 'play area') ||
                (item.source === 'hand' && source === 'discard')
            ) {
                return item.card.canPlay;
            }

            return false;
        },
        collect: (monitor) => {
            let item = monitor.getItem();

            return {
                isOver: monitor.isOver(),
                canDrop: monitor.canDrop(),
                itemSource: item && item.source
            };
        },
        drop: (_, monitor) => {
            let item = monitor.getItem();
            let dropPosition = monitor.getClientOffset();
            
            // Determine flank based on drop position (left or right half of play area)
            let flank = null;
            if (dropPosition && source === 'play area') {
                const playArea = document.querySelector('.play-area');
                if (playArea) {
                    const rect = playArea.getBoundingClientRect();
                    const midpoint = rect.left + rect.width / 2;
                    flank = dropPosition.x < midpoint ? 'left' : 'right';
                } else {
                    flank = dropPosition.x < window.innerWidth / 2 ? 'left' : 'right';
                }
            }

            if (onDragDrop) {
                onDragDrop(item.card, item.source, source, flank);
            }
        }
    });
    let className = classNames('overlay', {
        'drop-ok': isOver && canDrop,
        'no-drop': isOver && !canDrop && source !== itemSource,
        'can-drop': !isOver && canDrop,
        [source]: true
    });

    let dropClass = classNames('drop-target', {
        [source]: source !== 'play area'
    });

    return (
        <div className={dropClass} ref={drop}>
            <div className={className} />
            {children}
        </div>
    );
};

export default Droppable;
