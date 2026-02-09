    // src/lib/api/navigation.ts
'use client'

import { useRouter } from 'next/navigation'

export class NavigationService {
  private static router: any = null

  static initialize(router: any) {
    this.router = router
  }

  static navigateToOptimizer(slabIds: string[]) {
    if (!this.router) {
      console.warn('Router not initialized')
      return
    }
    this.router.push(`/optimizer?slabs=${slabIds.join(',')}`)
  }

  static navigateToSlabs() {
    if (!this.router) {
      console.warn('Router not initialized')
      return
    }
    this.router.push('/slabs')
  }
}

// Hook to initialize in components
export function useNavigation() {
  const router = useRouter()
  NavigationService.initialize(router)
  return NavigationService
}