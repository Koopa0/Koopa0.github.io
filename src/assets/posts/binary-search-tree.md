---
title: "二元搜尋樹實作與應用"
date: "2025-11-12"
tags: ["algorithm"]
description: "從零開始實作二元搜尋樹，包含插入、刪除、搜尋和遍歷操作，以及時間複雜度分析。"
---

# 二元搜尋樹實作與應用

二元搜尋樹（Binary Search Tree, BST）是一種基礎且重要的資料結構，在許多演算法和系統中都有應用。

## BST 定義

二元搜尋樹是一種二元樹，滿足以下性質：

1. 左子樹的所有節點值 < 根節點值
2. 右子樹的所有節點值 > 根節點值
3. 左右子樹也都是二元搜尋樹

## TypeScript 實作

### 節點定義

```typescript
class TreeNode<T> {
  value: T;
  left: TreeNode<T> | null = null;
  right: TreeNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}
```

### BST 類別

```typescript
class BinarySearchTree<T> {
  private root: TreeNode<T> | null = null;

  // 插入節點
  insert(value: T): void {
    this.root = this.insertNode(this.root, value);
  }

  private insertNode(node: TreeNode<T> | null, value: T): TreeNode<T> {
    if (node === null) {
      return new TreeNode(value);
    }

    if (value < node.value) {
      node.left = this.insertNode(node.left, value);
    } else if (value > node.value) {
      node.right = this.insertNode(node.right, value);
    }

    return node;
  }

  // 搜尋節點
  search(value: T): boolean {
    return this.searchNode(this.root, value);
  }

  private searchNode(node: TreeNode<T> | null, value: T): boolean {
    if (node === null) {
      return false;
    }

    if (value === node.value) {
      return true;
    }

    return value < node.value
      ? this.searchNode(node.left, value)
      : this.searchNode(node.right, value);
  }

  // 刪除節點
  delete(value: T): void {
    this.root = this.deleteNode(this.root, value);
  }

  private deleteNode(node: TreeNode<T> | null, value: T): TreeNode<T> | null {
    if (node === null) {
      return null;
    }

    if (value < node.value) {
      node.left = this.deleteNode(node.left, value);
      return node;
    } else if (value > node.value) {
      node.right = this.deleteNode(node.right, value);
      return node;
    }

    // 找到要刪除的節點

    // Case 1: 葉節點
    if (node.left === null && node.right === null) {
      return null;
    }

    // Case 2: 只有一個子節點
    if (node.left === null) {
      return node.right;
    }
    if (node.right === null) {
      return node.left;
    }

    // Case 3: 有兩個子節點
    // 找右子樹的最小值
    const minRight = this.findMin(node.right);
    node.value = minRight.value;
    node.right = this.deleteNode(node.right, minRight.value);
    return node;
  }

  private findMin(node: TreeNode<T>): TreeNode<T> {
    while (node.left !== null) {
      node = node.left;
    }
    return node;
  }
}
```

## 遍歷方法

### 中序遍歷（Inorder）

中序遍歷 BST 會得到排序的序列：

```typescript
class BinarySearchTree<T> {
  // ... 其他方法

  inorderTraversal(): T[] {
    const result: T[] = [];
    this.inorder(this.root, result);
    return result;
  }

  private inorder(node: TreeNode<T> | null, result: T[]): void {
    if (node === null) return;

    this.inorder(node.left, result);  // 左
    result.push(node.value);          // 根
    this.inorder(node.right, result); // 右
  }
}
```

### 前序遍歷（Preorder）

```typescript
preorderTraversal(): T[] {
  const result: T[] = [];
  this.preorder(this.root, result);
  return result;
}

private preorder(node: TreeNode<T> | null, result: T[]): void {
  if (node === null) return;

  result.push(node.value);          // 根
  this.preorder(node.left, result);  // 左
  this.preorder(node.right, result); // 右
}
```

### 後序遍歷（Postorder）

```typescript
postorderTraversal(): T[] {
  const result: T[] = [];
  this.postorder(this.root, result);
  return result;
}

private postorder(node: TreeNode<T> | null, result: T[]): void {
  if (node === null) return;

  this.postorder(node.left, result);  // 左
  this.postorder(node.right, result); // 右
  result.push(node.value);            // 根
}
```

### 層序遍歷（Level Order）

```typescript
levelOrderTraversal(): T[] {
  if (this.root === null) return [];

  const result: T[] = [];
  const queue: TreeNode<T>[] = [this.root];

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node.value);

    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }

  return result;
}
```

## 實用方法

### 找最小/最大值

```typescript
findMinValue(): T | null {
  if (this.root === null) return null;
  return this.findMin(this.root).value;
}

findMaxValue(): T | null {
  if (this.root === null) return null;
  let node = this.root;
  while (node.right !== null) {
    node = node.right;
  }
  return node.value;
}
```

### 計算高度

```typescript
height(): number {
  return this.calculateHeight(this.root);
}

private calculateHeight(node: TreeNode<T> | null): number {
  if (node === null) return -1;

  const leftHeight = this.calculateHeight(node.left);
  const rightHeight = this.calculateHeight(node.right);

  return Math.max(leftHeight, rightHeight) + 1;
}
```

### 驗證是否為有效 BST

```typescript
isValidBST(): boolean {
  return this.validate(this.root, null, null);
}

private validate(
  node: TreeNode<T> | null,
  min: T | null,
  max: T | null
): boolean {
  if (node === null) return true;

  if (min !== null && node.value <= min) return false;
  if (max !== null && node.value >= max) return false;

  return (
    this.validate(node.left, min, node.value) &&
    this.validate(node.right, node.value, max)
  );
}
```

## 時間複雜度

| 操作 | 平均 | 最壞 |
|------|------|------|
| 搜尋 | O(log n) | O(n) |
| 插入 | O(log n) | O(n) |
| 刪除 | O(log n) | O(n) |
| 遍歷 | O(n) | O(n) |

**註**：最壞情況發生在樹退化成鏈表時（例如按順序插入）。

## 使用範例

```typescript
const bst = new BinarySearchTree<number>();

// 插入節點
[50, 30, 70, 20, 40, 60, 80].forEach(val => bst.insert(val));

// 搜尋
console.log(bst.search(40));  // true
console.log(bst.search(25));  // false

// 遍歷
console.log(bst.inorderTraversal());  // [20, 30, 40, 50, 60, 70, 80]

// 找最小/最大值
console.log(bst.findMinValue());  // 20
console.log(bst.findMaxValue());  // 80

// 樹高度
console.log(bst.height());  // 2

// 刪除節點
bst.delete(50);
console.log(bst.inorderTraversal());  // [20, 30, 40, 60, 70, 80]
```

## 應用場景

1. **資料庫索引**：B-tree 和 B+ tree 是 BST 的變體
2. **檔案系統**：目錄結構
3. **表達式求值**：語法樹
4. **路由表**：網路路由
5. **優先序列**：透過 heap 實作

## 改進：平衡二元搜尋樹

為了避免最壞情況，可使用自平衡的 BST：

- **AVL Tree**：嚴格平衡，適合讀多寫少
- **Red-Black Tree**：相對平衡，適合讀寫平衡
- **Splay Tree**：自調整，適合局部性強的訪問

## 結論

二元搜尋樹是資料結構的基礎，掌握它對理解更複雜的樹狀結構至關重要。記住：

1. BST 的核心性質：左小右大
2. 遞迴是實作的最佳方式
3. 注意退化情況，考慮使用平衡樹

繼續練習，熟能生巧！
