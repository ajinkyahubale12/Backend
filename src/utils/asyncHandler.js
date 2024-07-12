const asyncHAndler = (requeestHandler) => {
  (req, res, next) => {
    Promise.resolve(requeestHandler(req,res,next)).catch((err) => next(err))
  }
}


export {asyncHAndler}


// const asyncHAndler = (fun) => async(req, res, next) => {
//   try {
    
//   } catch (error) {
    
//   }
// }