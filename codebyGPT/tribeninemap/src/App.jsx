import { useState, useRef, useEffect } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { Button } from '@/components/ui/button';
import ReactDOM from 'react-dom';

const RoomNode = ({ node, addPath, markVisited, removeNode, updateRoomText, updateNodeType, children, setContextMenu, isSimpleMode }) => {
  const menuRef = useRef(null);

  const getColor = () => {
    if (node.type === '출구') return 'bg-green-400';
    if (node.type === '시작') return 'bg-black text-white';
    if (node.type === '보스 방') return 'bg-red-400';
    return node.visited ? 'bg-green-200' : 'bg-gray-100';
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (node.type === '시작') return; // 시작 노드는 우클릭 메뉴 비활성화
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      nodeId: node.id,
    });
  };

  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setContextMenu(null);
    }
  };

  useEffect(() => {
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const changeNodeType = (type) => {
    updateNodeType(node.id, type);
    setContextMenu(null);
  };

  return (
    <TreeNode
      label={
        <div
          className={`inline-block p-1 rounded-xl text-center shadow-md ${getColor()} rotate-180`}
          onContextMenu={handleContextMenu}
        >
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
          <div className="flex space-x-1 justify-center mt-1" style={{ display: isSimpleMode ? 'none' : 'flex' }}>
            {!['출구', '보스 방'].includes(node.type) && (
              <>
                {node.type !== '시작' && (!node.visited ? (
                  <>
                    <Button size="sm" onClick={() => addPath(node.id, '일반 방')}>+</Button>
                    <Button size="sm" onClick={() => markVisited(node.id)}>O</Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => markVisited(node.id, false)}>X</Button>
                ))}
                {node.type === '시작' && (
                  <>
                    <Button size="sm" onClick={() => addPath(node.id, '일반 방')}>+</Button>
                  </>
                )}
              </>
            )}
            {node.type !== '시작' && (
                <Button size="sm" variant="destructive" onClick={() => removeNode(node.id)}>🗑️</Button>
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
  const [contextMenu, setContextMenu] = useState(null);
  const menuRef = useRef(null);
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

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

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      nodeId: node.id,
    });
  };

  const updateNodeType = (nodeId, newType) => {
    setMap(prevMap => {
      const updatedMap = updateNodeById(prevMap, nodeId, node => ({
        ...node,
        type: newType,
      }));
      localStorage.setItem('gameMap', JSON.stringify(updatedMap));
      return updatedMap;
    });
  };

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
      updateNodeType={updateNodeType}
      setContextMenu={setContextMenu}
      isSimpleMode={isSimpleMode}
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
  <div>각 블록에 마우스 우클릭: 속성 변경 (방, 보스, 출구 중 선택)</div>
  <div>각 블록의 버튼: 방, 보스, 출구 추가 / O 확인 완료 (블록 작아짐) / 지우기</div>
  <div>심플 모드: 텍스트 입력창 빼고 다 사라짐. 각 블록에 마우스 우클릭 시 모든 버튼 조작 가능 (추가, 변경 등)</div>
  
  {/* 스크롤 컨테이너 (회전 X) */}
  <div className="w-full flex justify-center items-center">
    <div className="max-w-[90vw] max-h-[80vh] overflow-auto p-4 border rounded-lg shadow-md bg-white">
      {/* 트리 컨테이너 (회전 O) */}
      <Tree>
        <div className="rotate-180 scale-90">
          {renderMap(map)}
        </div>
      </Tree>
    </div>
  </div>

  <div className="mt-4 space-y-2">
    <Button onClick={saveMap}>지도 저장하기</Button>
    <Button className="ml-2" onClick={loadMap}>지도 불러오기</Button>
    <Button className="ml-2" onClick={() => setIsSimpleMode(!isSimpleMode)}>
      {isSimpleMode ? '일반 모드' : '심플 모드'}
    </Button>
    <textarea
      className="w-full p-2 mt-2 border rounded bg-white"
      rows="5"
      value={mapText}
      onChange={(e) => setMapText(e.target.value)}
      placeholder="여기에 지도 데이터를 붙여넣거나 저장된 데이터가 표시됩니다."
    />
  </div>

  {contextMenu && ReactDOM.createPortal(
    <div
      ref={menuRef}
      className="absolute bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-[9999] transition-transform"
      style={{ top: contextMenu.y, left: contextMenu.x }}
    >
      {['일반 방', '보스 방', '출구'].map((typeOption) => (
        <div
          key={typeOption}
          className="p-2 cursor-pointer hover:bg-gray-100"
          onClick={() => {
            updateNodeType(contextMenu.nodeId, typeOption);
            setContextMenu(null);
          }}
        >
          {typeOption}
        </div>
      ))}
      {isSimpleMode && (
        <>
          <hr className="border-t border-gray-200 my-1" />
          <div
            className="p-2 cursor-pointer hover:bg-gray-100"
            onClick={() => {
              addPath(contextMenu.nodeId, '일반 방');
              setContextMenu(null);
            }}
          >
            + 방 추가
          </div>
          <div
            className="p-2 cursor-pointer hover:bg-gray-100"
            onClick={() => {
              markVisited(contextMenu.nodeId, true);
              setContextMenu(null);
            }}
          >
            O 방문 완료
          </div>
          <div
            className="p-2 cursor-pointer hover:bg-gray-100"
            onClick={() => {
              markVisited(contextMenu.nodeId, false);
              setContextMenu(null);
            }}
          >
            X 방문 취소
          </div>
          <div
            className="p-2 cursor-pointer text-red-500 hover:bg-gray-100"
            onClick={() => {
              removeNode(contextMenu.nodeId);
              setContextMenu(null);
            }}
          >
            🗑️ 삭제
          </div>
        </>
      )}
    </div>,
    document.getElementById('context-menu-root')
  )}
</div>
  );
};

export default MapBuilder;
