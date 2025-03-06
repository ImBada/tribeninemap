import React, { useState } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { Button } from '@/components/ui/button';

const RoomNode = ({ node, addPath, markVisited, removeNode, updateRoomText, children }) => {
  const getColor = () => {
    if (node.type === '출구') return 'bg-green-400';
    if (node.type === '시작') return 'bg-black text-white';
    if (node.type === '보스 방') return 'bg-red-400';
    return node.visited ? 'bg-green-200' : 'bg-gray-100';
  };

  const isEndRoom = ['출구', '보스 방'].includes(node.type);
  const isStartRoom = ['시작'].includes(node.type);

  return (
    <TreeNode
      label={
        <div className={`inline-block p-1 rounded-xl text-center shadow-md ${getColor()} rotate-180`}>
          <div className="text-xs">
            {node.type === '일반 방' ? (
              <input
                className="text-center border-b w-full"
                type="text"
                value={node.text || ''}
                onChange={(e) => updateRoomText(node.id, e.target.value)}
                placeholder="메모"
              />
            ) : (
              node.type
            )}
          </div>
          <div className="flex space-x-1 justify-center mt-1">
            {!isEndRoom && (
              <>
                {!isStartRoom && (!node.visited ? (
                  <>
                  <Button size="sm" onClick={() => addPath(node.id, '일반 방')}>방</Button>
                  <Button size="sm" onClick={() => addPath(node.id, '보스 방')}>보스</Button>
                  <Button size="sm" onClick={() => addPath(node.id, '출구')}>출구</Button>
                  <Button size="sm" onClick={() => markVisited(node.id)}>O</Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => markVisited(node.id, false)}>X</Button>
                ))}

              </>
            )}
            {isStartRoom && (
              <>
                  <Button size="sm" onClick={() => addPath(node.id, '일반 방')}>방</Button>
                  <Button size="sm" onClick={() => addPath(node.id, '보스 방')}>보스</Button>
                  <Button size="sm" onClick={() => addPath(node.id, '출구')}>출구</Button>
              </>
            )}
            {node.type !== '시작' && (
              <>
              <Button size="sm" variant="destructive" onClick={() => removeNode(node.id)}>🗑️</Button>
              </>
            )}

          </div>
        </div>
      }
    >
      {children}
    </TreeNode>
  );
};

const MapBuilder = () => {
  const [map, setMap] = useState(() => {
    const savedMap = localStorage.getItem('gameMap');
    return savedMap
      ? JSON.parse(savedMap)
      : {
          id: 1,
          number: 1,
          type: '시작',
          visited: true,
          children: [],
        };
  });

  const [mapText, setMapText] = useState('');

  const updateNodeById = (node, nodeId, updater) => {
    if (node.id === nodeId) return updater(node);
    return {
      ...node,
      children: node.children.map(child => updateNodeById(child, nodeId, updater)),
    };
  };

  const removeNodeById = (node, nodeId) => ({
    ...node,
    children: node.children
      .filter(child => child.id !== nodeId)
      .map(child => removeNodeById(child, nodeId)),
  });

  const addPath = (nodeId, pathType) => {
    const newNode = {
      id: Date.now(),
      number: Math.ceil(Math.random() * 5),
      type: pathType,
      visited: false,
      children: [],
    };

    setMap(prevMap => {
      const updatedMap = updateNodeById(prevMap, nodeId, node => ({
        ...node,
        children: [newNode, ...node.children],
      }));
      localStorage.setItem('gameMap', JSON.stringify(updatedMap));
      return updatedMap;
    });
  };

  const markVisited = (nodeId, visited = true) => {
    setMap(prevMap => {
      const updatedMap = updateNodeById(prevMap, nodeId, node => ({
        ...node,
        visited,
      }));
      localStorage.setItem('gameMap', JSON.stringify(updatedMap));
      return updatedMap;
    });
  };

  const removeNode = (nodeId) => {
    setMap(prevMap => {
      const updatedMap = removeNodeById(prevMap, nodeId);
      localStorage.setItem('gameMap', JSON.stringify(updatedMap));
      return updatedMap;
    });
  };

  const updateRoomText = (nodeId, text) => {
    setMap(prevMap => {
      const updatedMap = updateNodeById(prevMap, nodeId, node => ({
        ...node,
        text,
      }));
      localStorage.setItem('gameMap', JSON.stringify(updatedMap));
      return updatedMap;
    });
  };

  const renderMap = (node) => (
    <RoomNode
      key={node.id}
      node={node}
      addPath={addPath}
      markVisited={markVisited}
      removeNode={removeNode}
      updateRoomText={updateRoomText}
    >
      {node.children.map(renderMap)}
    </RoomNode>
  );

  const saveMap = () => {
    const mapStr = JSON.stringify(map);
    setMapText(mapStr);
    navigator.clipboard.writeText(mapStr);
  };

  const loadMap = () => {
    if (mapText) setMap(JSON.parse(mapText));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">프랙탈 간이 지도 그리기</h2>
      <div className="rotate-180 w-full min-h-screen bg-white overflow-auto">
        <Tree label={<div className="text-lg rotate-180">시작</div>}>
          {renderMap(map)}
        </Tree>
      </div>
      <div className="mt-4 space-y-2">
        <Button onClick={saveMap}>지도 저장하기</Button>
        <Button className="ml-2" onClick={loadMap}>지도 불러오기</Button>
        <textarea
          className="w-full p-2 mt-2 border rounded bg-white"
          rows="5"
          value={mapText}
          onChange={(e) => setMapText(e.target.value)}
          placeholder="여기에 지도 데이터를 붙여넣거나 저장된 데이터가 표시됩니다."
        />
      </div>
    </div>
  );
};

export default MapBuilder;
