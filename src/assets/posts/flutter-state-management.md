---
title: "Flutter 狀態管理完整指南"
date: "2025-11-07"
tags: ["flutter"]
description: "比較 Flutter 各種狀態管理方案，包含 Provider、Riverpod、Bloc 和 GetX 的優缺點與使用場景。"
---

# Flutter 狀態管理完整指南

Flutter 的狀態管理是開發中最重要的決策之一。本文比較主流的狀態管理方案，幫助您選擇最適合的解決方案。

## 為什麼需要狀態管理？

在 Flutter 中，當應用變得複雜時：

- Widget 樹深度增加
- 多個 Widget 需要共享狀態
- 需要跨頁面傳遞資料
- 業務邏輯與 UI 需要分離

## 1. Provider

### 優點
✅ Flutter 官方推薦
✅ 簡單易學
✅ 效能好
✅ 與 Flutter 整合良好

### 基本使用

```dart
// 1. 建立狀態類
class Counter extends ChangeNotifier {
  int _count = 0;
  int get count => _count;

  void increment() {
    _count++;
    notifyListeners();
  }
}

// 2. 在根 Widget 提供
void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => Counter(),
      child: MyApp(),
    ),
  );
}

// 3. 在 Widget 中使用
class CounterScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final counter = context.watch<Counter>();

    return Scaffold(
      body: Center(
        child: Text('Count: ${counter.count}'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.read<Counter>().increment(),
        child: Icon(Icons.add),
      ),
    );
  }
}
```

### 多個 Provider

```dart
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => Counter()),
    ChangeNotifierProvider(create: (_) => UserAuth()),
    Provider(create: (_) => ApiService()),
  ],
  child: MyApp(),
)
```

## 2. Riverpod

Riverpod 是 Provider 的進化版，解決了 Provider 的一些限制。

### 優點
✅ 編譯時安全
✅ 不依賴 BuildContext
✅ 支援異步狀態
✅ 更好的測試性

### 基本使用

```dart
// 1. 定義 Provider
final counterProvider = StateNotifierProvider<CounterNotifier, int>((ref) {
  return CounterNotifier();
});

class CounterNotifier extends StateNotifier<int> {
  CounterNotifier() : super(0);

  void increment() => state++;
  void decrement() => state--;
}

// 2. 在根 Widget 包裹
void main() {
  runApp(
    ProviderScope(
      child: MyApp(),
    ),
  );
}

// 3. 在 Widget 中使用
class CounterScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);

    return Scaffold(
      body: Center(
        child: Text('Count: $count'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => ref.read(counterProvider.notifier).increment(),
        child: Icon(Icons.add),
      ),
    );
  }
}
```

### 異步資料

```dart
final userProvider = FutureProvider<User>((ref) async {
  final response = await http.get(Uri.parse('/api/user'));
  return User.fromJson(jsonDecode(response.body));
});

class UserProfile extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(userProvider);

    return userAsync.when(
      data: (user) => Text('Hello, ${user.name}'),
      loading: () => CircularProgressIndicator(),
      error: (error, stack) => Text('Error: $error'),
    );
  }
}
```

## 3. BLoC (Business Logic Component)

### 優點
✅ 明確的業務邏輯分離
✅ 易於測試
✅ 適合大型團隊
✅ 強制單向資料流

### 基本使用

```dart
// 1. 定義 Events
abstract class CounterEvent {}
class IncrementPressed extends CounterEvent {}
class DecrementPressed extends CounterEvent {}

// 2. 定義 State
class CounterState {
  final int count;
  CounterState(this.count);
}

// 3. 建立 BLoC
class CounterBloc extends Bloc<CounterEvent, CounterState> {
  CounterBloc() : super(CounterState(0)) {
    on<IncrementPressed>((event, emit) {
      emit(CounterState(state.count + 1));
    });

    on<DecrementPressed>((event, emit) {
      emit(CounterState(state.count - 1));
    });
  }
}

// 4. 提供 BLoC
BlocProvider(
  create: (_) => CounterBloc(),
  child: MyApp(),
)

// 5. 在 Widget 中使用
class CounterScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CounterBloc, CounterState>(
      builder: (context, state) {
        return Scaffold(
          body: Center(
            child: Text('Count: ${state.count}'),
          ),
          floatingActionButton: FloatingActionButton(
            onPressed: () {
              context.read<CounterBloc>().add(IncrementPressed());
            },
            child: Icon(Icons.add),
          ),
        );
      },
    );
  }
}
```

## 4. GetX

### 優點
✅ 簡潔的 API
✅ 路由管理整合
✅ 依賴注入
✅ 效能優異

### 基本使用

```dart
// 1. 建立 Controller
class CounterController extends GetxController {
  var count = 0.obs;

  void increment() => count++;
}

// 2. 在 Widget 中使用
class CounterScreen extends StatelessWidget {
  final CounterController controller = Get.put(CounterController());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Obx(() => Text('Count: ${controller.count}')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: controller.increment,
        child: Icon(Icons.add),
      ),
    );
  }
}
```

## 方案比較

| 特性 | Provider | Riverpod | BLoC | GetX |
|------|----------|----------|------|------|
| 學習曲線 | 低 | 中 | 高 | 低 |
| 樣板程式碼 | 少 | 少 | 多 | 極少 |
| 型別安全 | 中 | 高 | 高 | 低 |
| 社群支援 | 極佳 | 佳 | 極佳 | 佳 |
| 適合規模 | 中小型 | 所有 | 大型 | 中小型 |

## 選擇建議

### 選擇 Provider 如果：
- 第一次接觸狀態管理
- 中小型專案
- 需要官方支援

### 選擇 Riverpod 如果：
- 需要更好的型別安全
- 希望脫離 BuildContext
- 複雜的異步邏輯

### 選擇 BLoC 如果：
- 大型團隊開發
- 需要嚴格的架構
- 業務邏輯複雜

### 選擇 GetX 如果：
- 想要快速開發
- 需要路由管理
- 偏好簡潔的 API

## 最佳實踐

### 1. 狀態分層

```dart
// UI State
class UIState {
  bool isLoading;
  String? errorMessage;
}

// Business State
class UserState {
  User? currentUser;
  List<Post> posts;
}
```

### 2. 不可變狀態

```dart
// ✅ 推薦
class TodoState {
  final List<Todo> todos;
  const TodoState(this.todos);

  TodoState copyWith({List<Todo>? todos}) {
    return TodoState(todos ?? this.todos);
  }
}

// ❌ 避免
class TodoState {
  List<Todo> todos = [];
}
```

### 3. 分離業務邏輯

```dart
// Repository
class UserRepository {
  Future<User> fetchUser(String id) async {
    // API 呼叫
  }
}

// Provider/BLoC
class UserNotifier extends StateNotifier<AsyncValue<User>> {
  UserNotifier(this.repository) : super(AsyncValue.loading());

  final UserRepository repository;

  Future<void> loadUser(String id) async {
    state = AsyncValue.loading();
    final result = await repository.fetchUser(id);
    state = AsyncValue.data(result);
  }
}
```

## 結論

沒有完美的狀態管理方案，選擇取決於：
- 團隊經驗
- 專案規模
- 維護需求
- 效能要求

**我的建議**：
- 新手從 **Provider** 開始
- 進階使用 **Riverpod**
- 大型專案考慮 **BLoC**

最重要的是：**一致性**比**完美性**更重要！
