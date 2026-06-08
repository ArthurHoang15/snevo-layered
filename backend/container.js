/**
 * 🏗️ Dependency Injection Container
 * Wires all layers together: Infrastructure → Data → Business → Presentation
 * 
 * This is the composition root - the only place where all layers are imported together.
 */

// ── Infrastructure ──
import createSupabaseConfig from './infrastructure/database/supabase.js';

// ── Data / Repositories ─-
import ShoeRepository from './data/repositories/ShoeRepository.js';
import CategoryRepository from './data/repositories/CategoryRepository.js';
import OrderRepository from './data/repositories/OrderRepository.js';
import OrderItemRepository from './data/repositories/OrderItemRepository.js';
import CartRepository from './data/repositories/CartRepository.js';
import PaymentRepository from './data/repositories/PaymentRepository.js';
import ProfileRepository from './data/repositories/ProfileRepository.js';
import AddressRepository from './data/repositories/AddressRepository.js';
import ReviewRepository from './data/repositories/ReviewRepository.js';
import ShoeVariantRepository from './data/repositories/ShoeVariantRepository.js';
import ColorRepository from './data/repositories/ColorRepository.js';
import SizeRepository from './data/repositories/SizeRepository.js';
import ImportRepository from './data/repositories/ImportRepository.js';

// ── Business / Services ──
import ProductService from './business/services/ProductService.js';
import CategoryService from './business/services/CategoryService.js';
import OrderService from './business/services/OrderService.js';
import CartService from './business/services/CartService.js';
import PaymentService from './business/services/PaymentService.js';
import ProfileService from './business/services/ProfileService.js';
import AddressService from './business/services/AddressService.js';
import ReviewService from './business/services/ReviewService.js';
import VariantService from './business/services/VariantService.js';
import ImportService from './business/services/ImportService.js';
import AdminService from './business/services/AdminService.js';

// ── Presentation / Controllers ──
import ProductController from './presentation/controllers/ProductController.js';
import CategoryController from './presentation/controllers/CategoryController.js';
import OrderController from './presentation/controllers/OrderController.js';
import CartController from './presentation/controllers/CartController.js';
import PaymentController from './presentation/controllers/PaymentController.js';
import ProfileController from './presentation/controllers/ProfileController.js';
import AddressController from './presentation/controllers/AddressController.js';
import ReviewController from './presentation/controllers/ReviewController.js';
import VariantController from './presentation/controllers/VariantController.js';
import ColorController from './presentation/controllers/ColorController.js';
import SizeController from './presentation/controllers/SizeController.js';
import ImportController from './presentation/controllers/ImportController.js';
import AdminController from './presentation/controllers/AdminController.js';

/**
 * Build the full dependency container
 * @returns {{ controllers, services, repositories }}
 */
export default function buildContainer() {
    console.log('🏗️  Building dependency container...');

    // ── 1. Infrastructure (Supabase client singleton) ──
    const supabaseConfig = createSupabaseConfig();
    let supabase = null;
    try {
        supabase = supabaseConfig.getAdminClient();
    } catch (error) {
        console.warn('⚠️ Supabase Admin Client not configured. Database queries will fail, but server will start.');
    }

    // ── 2. Repositories (Data Layer) ──
    const repositories = {
        shoe:       new ShoeRepository(supabase),
        category:   new CategoryRepository(supabase),
        order:      new OrderRepository(supabase),
        orderItem:  new OrderItemRepository(supabase),
        cart:       new CartRepository(supabase),
        payment:    new PaymentRepository(supabase),
        profile:    new ProfileRepository(supabase),
        address:    new AddressRepository(supabase),
        review:     new ReviewRepository(supabase),
        variant:    new ShoeVariantRepository(supabase),
        color:      new ColorRepository(supabase),
        size:       new SizeRepository(supabase),
        import:     new ImportRepository(supabase)
    };

    console.log('✅ Repositories initialized:', Object.keys(repositories).length);

    // ── 3. Services (Business Layer) ──
    const services = {
        product: new ProductService({
            shoeRepository: repositories.shoe,
            categoryRepository: repositories.category,
            variantRepository: repositories.variant
        }),
        category: new CategoryService({
            categoryRepository: repositories.category
        }),
        order: new OrderService({
            orderRepository: repositories.order,
            orderItemRepository: repositories.orderItem,
            cartRepository: repositories.cart,
            paymentRepository: repositories.payment,
            addressRepository: repositories.address,
            variantRepository: repositories.variant
        }),
        cart: new CartService({
            cartRepository: repositories.cart,
            variantRepository: repositories.variant
        }),
        payment: new PaymentService({
            paymentRepository: repositories.payment,
            orderRepository: repositories.order
        }),
        profile: new ProfileService({
            profileRepository: repositories.profile
        }),
        address: new AddressService({
            addressRepository: repositories.address
        }),
        review: new ReviewService({
            reviewRepository: repositories.review,
            shoeRepository: repositories.shoe
        }),
        variant: new VariantService({
            variantRepository: repositories.variant,
            shoeRepository: repositories.shoe,
            colorRepository: repositories.color,
            sizeRepository: repositories.size
        }),
        import: new ImportService({
            importRepository: repositories.import,
            variantRepository: repositories.variant
        }),
        admin: new AdminService({
            productRepository: repositories.shoe,
            categoryRepository: repositories.category,
            orderRepository: repositories.order,
            orderItemRepository: repositories.orderItem,
            paymentRepository: repositories.payment,
            variantRepository: repositories.variant
        })
    };

    console.log('✅ Services initialized:', Object.keys(services).length);

    // ── 4. Controllers (Presentation Layer) ──
    const controllers = {
        product:  new ProductController({ productService: services.product }),
        category: new CategoryController({ categoryService: services.category }),
        order:    new OrderController({ orderService: services.order }),
        cart:     new CartController({ cartService: services.cart }),
        payment:  new PaymentController({ paymentService: services.payment }),
        profile:  new ProfileController({ profileService: services.profile }),
        address:  new AddressController({ addressService: services.address }),
        review:   new ReviewController({ reviewService: services.review }),
        variant:  new VariantController({ variantService: services.variant }),
        color:    new ColorController({ colorRepository: repositories.color }),
        size:     new SizeController({ sizeRepository: repositories.size }),
        import:   new ImportController({ importService: services.import }),
        admin:    new AdminController({ adminService: services.admin })
    };

    console.log('✅ Controllers initialized:', Object.keys(controllers).length);
    console.log('🏗️  Container built successfully!');

    return { controllers, services, repositories };
}
